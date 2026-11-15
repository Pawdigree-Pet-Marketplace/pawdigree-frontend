import { useEffect, useState, type FormEvent, useRef } from "react";
import {
  ImagePlus,
  LoaderCircle,
  PawPrint,
  Trash2,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BackButton from "../../components/BackButton/BackButton";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";
import { countWords } from "../../utils/petUtils";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./VendorEditPetListing.css";

type Business = { id: string; name: string };
type BusinessResponse = Business[] | { results: Business[] };
type ListingType = "ADOPTION" | "SALE";
type Option = { value: string; label: string };
type ExistingPhoto = {
  id?: string | number;
  image_id?: number;
  image?: string;
  image_url?: string;
  url?: string;
};
type VendorPet = {
  pet_id: number;
  name?: string;
  species?: string;
  breed?: string;
  age?: number | null;
  gender?: string;
  size?: string;
  description?: string;
  price?: string | number | null;
  listing_type?: ListingType;
  business?: number | string | null;
  images?: ExistingPhoto[];
};
type VendorPetResponse = VendorPet[] | { results: VendorPet[] };
const MAX_DESCRIPTION_WORDS = 300;

async function readError(response: Response): Promise<string> {
  if (response.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length > 0) {
      return entries
        .map(function (kv) {
          const field = kv[0];
          const value = kv[1];
          const text = Array.isArray(value)
            ? (value as string[]).join(" ")
            : String(value);
          return field + ": " + text;
        })
        .join("\n");
    }
  }
  return "Request failed (" + response.status + ").";
}

function BrandSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div className="brand-dropdown" ref={ref}>
      <button
        type="button"
        className={`brand-dropdown-trigger ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={selected ? "has-value" : "placeholder"}>
          {selected ? selected.label : placeholder || "Select"}
        </span>
        <ChevronDown
          size={18}
          className={`brand-dropdown-chevron ${open ? "rotated" : ""}`}
        />
      </button>
      {open && (
        <div className="brand-dropdown-menu">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`brand-dropdown-option ${value === opt.value ? "selected" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VendorEditPetListing() {
  const activeBusiness = useVendorBusiness();
  const activeBusinessId = activeBusiness ? String(activeBusiness.id) : null;
  const { petId = "" } = useParams();
  const navigate = useNavigate();
  const id = petId;
  const isIdMissing = !id || id === "edit-pet";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingPet, setLoadingPet] = useState(!isIdMissing);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [listingType, setListingType] = useState<ListingType>("ADOPTION");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Dog");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("UNKNOWN");
  const [size, setSize] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>(
    [],
  );
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);

  const primaryPhoto =
    existingPhotos[0]?.image ||
    existingPhotos[0]?.image_url ||
    existingPhotos[0]?.url ||
    null;

  const speciesOptions: Option[] = [
    { value: "Dog", label: "Dog" },
    { value: "Cat", label: "Cat" },
    { value: "Fish", label: "Fish" },
    { value: "Bird", label: "Bird" },
  ];
  const genderOptions: Option[] = [
    { value: "UNKNOWN", label: "Not specified" },
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
  ];
  const sizeOptions: Option[] = [
    { value: "SMALL", label: "Small" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LARGE", label: "Large" },
  ];

  useEffect(() => {
    if (isIdMissing) return;
    async function loadBusinesses() {
      try {
        const res = await vendorAuthenticatedFetch(
          `${API_BASE_URL}/api/businesses/`,
        );
        if (!res.ok) throw new Error(await readError(res));
        const data = (await res.json()) as BusinessResponse;
        const items = Array.isArray(data) ? data : data.results;
        setBusinesses(items);
      } finally {
        setLoadingBusinesses(false);
      }
    }
    async function loadPet() {
      try {
        // The backend exposes listing detail through the vendor-owned list route;
        // /api/pets/{id}/edit/ accepts PATCH/PUT only.
        const res = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/pets/${activeBusinessId ? `?business_id=${encodeURIComponent(activeBusinessId)}` : ""}`);
        if (!res.ok) throw new Error(await readError(res));
        const data = (await res.json()) as VendorPetResponse;
        const pets = Array.isArray(data) ? data : data.results;
        const pet = pets.find((listing) => String(listing.pet_id) === id && (!activeBusinessId || String(listing.business) === activeBusinessId));
        if (!pet) throw new Error("Pet not found.");
        setName(pet.name || "");
        setSpecies(pet.species || "Dog");
        setBreed(pet.breed || "");
        setAge(pet.age != null ? String(pet.age) : "");
        setGender(pet.gender || "UNKNOWN");
        setSize(pet.size || "MEDIUM");
        setDescription(pet.description || "");
        setPrice(pet.price != null ? String(pet.price) : "");
        setListingType(
          pet.listing_type === "SALE" ? "SALE" : pet.listing_type || "ADOPTION",
        );
        setBusinessId(activeBusinessId ?? (pet.business != null ? String(pet.business) : ""));
        setExistingPhotos(pet.images || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pet not found.");
      } finally {
        setLoadingPet(false);
      }
    }
    loadBusinesses();
    loadPet();
  }, [id, isIdMissing, activeBusinessId]);

  if (isIdMissing) {
    return (
      <VendorLayout
        title="Edit pet listing"
        description="No pet selected"
        vendorWorkspace
      >
        <div className="dashboard-content vendor-pet-page">
          <div className="pet-form-section">
            <h2>No Pet ID</h2>
            <p>
              Go to <Link to="/vendor/listings">/vendor/listings</Link> and
              click Edit.
            </p>
          </div>
        </div>
      </VendorLayout>
    );
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (
      selected.find(
        (f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type),
      )
    ) {
      setError("JPG, PNG or WebP only.");
      return;
    }
    if (selected.find((f) => f.size > 5 * 1024 * 1024)) {
      setError("Max 5MB per photo.");
      return;
    }
    setError("");
    setNewPhotos((curr) => [
      ...curr,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const selectedBusinessId = activeBusiness ? String(activeBusiness.id) : businessId;
    if (!selectedBusinessId) {
      setError("Select business");
      return;
    }
    if (existingPhotos.length + newPhotos.length === 0) {
      setError("Keep at least 1 photo");
      return;
    }
    if (countWords(description) > MAX_DESCRIPTION_WORDS) {
      setError("Description must be 300 words or fewer.");
      return;
    }
    const formData = new FormData();
    formData.append("business", selectedBusinessId);
    formData.append("listing_type", listingType);
    formData.append("name", name.trim());
    formData.append("species", species.trim());
    formData.append("breed", breed.trim());
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("size", size);
    formData.append("description", description.trim());
    if (listingType === "SALE") formData.append("price", price);
    removedPhotoIds.forEach((photoId) => {
      formData.append("remove_image_ids", String(photoId));
    });
    newPhotos.forEach(function (item) {
      formData.append("images", item.file);
    });
    setSubmitting(true);
    try {
      const res = await vendorAuthenticatedFetch(
        `${API_BASE_URL}/api/pets/${id}/edit/${activeBusiness ? `?business_id=${encodeURIComponent(String(activeBusiness.id))}` : ""}`,
        {
          method: "PATCH",
          body: formData,
        },
      );
      if (!res.ok) throw new Error(await readError(res));
      setSuccess("Pet updated!");
      setTimeout(() => {
        navigate(activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "listings") : "/vendor/listings");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  const galleryPhotos = [
    ...existingPhotos.map((photo) => new URL(photo.image || photo.image_url || photo.url || "", API_BASE_URL).href),
    ...newPhotos.map((photo) => photo.preview),
  ];

  if (loadingPet) {
    return (
      <VendorLayout
        title="Edit pet listing"
        description={"Loading " + id + "..."}
        vendorWorkspace
      >
        <div className="dashboard-content vendor-pet-page">Loading...</div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout
      title="Edit pet listing"
      description="Update your pet listing details."
      vendorWorkspace
    >
      <div className="dashboard-content vendor-pet-page">
        <BackButton fallback={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "listings") : "/vendor/listings"} label="Back to listings" />
        {success && <p className="pet-form-message success pet-form-success-top" role="status">{success}</p>}
        <form className="pet-listing-form" onSubmit={handleSubmit}>
          <section className="pet-form-section">
            <div className="pet-section-heading">
              <span
                className={`pet-section-icon ${primaryPhoto ? "has-photo" : ""}`}
              >
                {primaryPhoto ? (
                  <img src={primaryPhoto} alt={name} />
                ) : (
                  <PawPrint size={20} />
                )}
              </span>
              <div>
                <h2>Pet information</h2>
                <p>
                  {name ? "Edit pet details for " + name : "Edit pet details"}
                </p>
              </div>
            </div>

            {!activeBusiness && <label className="pet-field">
              <span className="pet-field-label">
                Your business <i>*</i>
              </span>
              <BrandSelect
                value={businessId}
                onChange={setBusinessId}
                placeholder={
                  loadingBusinesses ? "Loading..." : "Select a business"
                }
                options={businesses.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
                disabled={loadingBusinesses}
              />
            </label>}

            <div className="pet-field">
              <span className="pet-field-label">
                Listing type <i>*</i>
              </span>
              <div className="pet-choice-group">
                <label className={listingType === "ADOPTION" ? "selected" : ""}>
                  <input
                    type="radio"
                    name="listingType"
                    value="ADOPTION"
                    checked={listingType === "ADOPTION"}
                    onChange={() => setListingType("ADOPTION")}
                  />
                  Adoption
                </label>
                <label className={listingType === "SALE" ? "selected" : ""}>
                  <input
                    type="radio"
                    name="listingType"
                    value="SALE"
                    checked={listingType === "SALE"}
                    onChange={() => setListingType("SALE")}
                  />
                  For sale
                </label>
              </div>
            </div>

            <div className="pet-form-grid">
              <label className="pet-field">
                <span className="pet-field-label">
                  Pet name <i>*</i>
                </span>
                <input
                  className="brand-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Bella"
                />
              </label>
              <label className="pet-field">
                <span className="pet-field-label">
                  Species <i>*</i>
                </span>
                <BrandSelect
                  value={species}
                  onChange={setSpecies}
                  options={speciesOptions}
                />
              </label>
              <label className="pet-field">
                <span className="pet-field-label">Breed</span>
                <input
                  className="brand-input"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Labrador"
                />
              </label>
              <label className="pet-field">
                <span className="pet-field-label">
                  Age in months <i>*</i>
                </span>
                <input
                  className="brand-input"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  placeholder="e.g. 8"
                />
              </label>
              <label className="pet-field">
                <span className="pet-field-label">
                  Gender <i>*</i>
                </span>
                <BrandSelect
                  value={gender}
                  onChange={setGender}
                  options={genderOptions}
                />
              </label>
              <label className="pet-field">
                <span className="pet-field-label">
                  Size <i>*</i>
                </span>
                <BrandSelect
                  value={size}
                  onChange={setSize}
                  options={sizeOptions}
                />
              </label>
              {listingType === "SALE" && (
                <label className="pet-field">
                  <span className="pet-field-label">
                    Price (UGX) <i>*</i>
                  </span>
                  <input
                    className="brand-input"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter sale price"
                  />
                </label>
              )}
            </div>

            <label className="pet-field">
              <span className="pet-field-label">Description</span>
              <textarea
                className="brand-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                aria-describedby="edit-pet-description-count"
                placeholder="Tell customers about this pet..."
              />
              <span id="edit-pet-description-count" className="pet-description-count">{countWords(description)} / {MAX_DESCRIPTION_WORDS} words</span>
            </label>
          </section>

          <section className="pet-form-section">
            <div className="pet-section-heading">
              <span className="pet-section-icon">
                <ImagePlus size={20} />
              </span>
              <div>
                <h2>Pet photos</h2>
                <p>
                  {existingPhotos.length + newPhotos.length === 0
                    ? "Upload multiple clear photos. The first photo will be the primary image."
                    : existingPhotos.length +
                      newPhotos.length +
                      " photos - first is primary"}
                </p>
              </div>
            </div>
            <div
              className="pet-upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={28} />
              <strong>Click to add more photos</strong>
              <span>JPG, PNG or WebP · Max 5 MB</span>
              <div className="pet-upload-btn">Browse files</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {(existingPhotos.length > 0 || newPhotos.length > 0) && (
              <div className="pet-photo-grid">
                {existingPhotos.map((ph, idx) => (
                  <div className="pet-photo-card" key={"ex-" + idx}>
                    <img src={new URL(ph.image || ph.image_url || ph.url || "", API_BASE_URL).href} alt={`Existing pet photo ${idx + 1}`} role="button" tabIndex={0} onClick={() => setViewingPhotoIndex(idx)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setViewingPhotoIndex(idx); }} />
                    <button
                      type="button"
                      onClick={() => {
                        const photoId = ph.image_id ?? ph.id;
                        if (photoId !== undefined) {
                          setRemovedPhotoIds((current) => [
                            ...current,
                            Number(photoId),
                          ]);
                        }
                        setExistingPhotos((current) =>
                          current.filter((_, i) => i !== idx),
                        );
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    {idx === 0 && (
                      <span className="pet-primary-badge">Primary</span>
                    )}
                  </div>
                ))}
                {newPhotos.map((ph, idx) => (
                  <div className="pet-photo-card" key={ph.preview}>
                    <img src={ph.preview} alt={`New pet photo ${idx + 1}`} role="button" tabIndex={0} onClick={() => setViewingPhotoIndex(existingPhotos.length + idx)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setViewingPhotoIndex(existingPhotos.length + idx); }} />
                    <button
                      type="button"
                      onClick={() =>
                        setNewPhotos((curr) => {
                          URL.revokeObjectURL(curr[idx].preview);
                          return curr.filter((_, i) => i !== idx);
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                    <span className="badge-new">New</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && <p className="pet-form-message error">{error}</p>}

          <div className="pet-form-actions">
            <Link to="/vendor/listings" className="pet-cancel-button">
              Cancel
            </Link>
            <button
              className="pet-submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="pet-spinner" size={18} /> Updating...
                </>
              ) : (
                "Update pet"
              )}
            </button>
          </div>
        </form>
        {viewingPhotoIndex !== null && galleryPhotos.length > 0 && (
          <div className="pet-gallery-backdrop" role="dialog" aria-modal="true" aria-label="Pet photo carousel" onClick={() => setViewingPhotoIndex(null)}>
            <button type="button" className="pet-gallery-close" onClick={() => setViewingPhotoIndex(null)} aria-label="Close photo viewer">×</button>
            <button type="button" className="pet-gallery-arrow" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); setViewingPhotoIndex((viewingPhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length); }}><ChevronLeft /></button>
            <img className="pet-gallery-image" src={galleryPhotos[viewingPhotoIndex]} alt={`Pet photo ${viewingPhotoIndex + 1} of ${galleryPhotos.length}`} onClick={(event) => event.stopPropagation()} />
            <button type="button" className="pet-gallery-arrow" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); setViewingPhotoIndex((viewingPhotoIndex + 1) % galleryPhotos.length); }}><ChevronRight /></button>
            <span className="pet-gallery-count">{viewingPhotoIndex + 1} / {galleryPhotos.length}</span>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

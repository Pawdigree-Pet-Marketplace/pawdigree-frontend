import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ImagePlus,
  LoaderCircle,
  PawPrint,
  Trash2,
} from "lucide-react";
import API_BASE_URL from "../../services/api";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import "./VendorAddPetPage.css";

type Business = {
  id: string;
  name: string;
};

type BusinessResponse =
  | Business[]
  | {
      results: Business[];
    };

type PetPhoto = {
  file: File;
  preview: string;
};

type ListingType = "ADOPTION" | "SALE";

async function readError(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    return (
      Object.entries(data as Record<string, unknown>)
        .map(([field, value]) => {
          const messages = Array.isArray(value)
            ? value.join(" ")
            : String(value);
          return `${field}: ${messages}`;
        })
        .join("\n") || `Request failed (${response.status}).`
    );
  }

  return `Request failed (${response.status}).`;
}

export default function VendorAddPetPage() {
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
  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "Add Pet Listing - Pawdigree";

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");

    if (!token || role !== "VENDOR") {
      window.location.href = "/vendor/login";
      return;
    }

    async function loadBusinesses() {
      try {
        const response = await fetch(`${API_BASE_URL}/businesses/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const data = (await response.json()) as BusinessResponse;
        const items = Array.isArray(data) ? data : data.results;

        setBusinesses(items);
        if (items.length > 0) {
          setBusinessId(items[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load your businesses.",
        );
      } finally {
        setLoadingBusinesses(false);
      }
    }

    void loadBusinesses();
  }, []);

  function addPhotos(files: FileList | null) {
    if (!files) return;

    setError("");
    setSuccess("");

    const selected = Array.from(files);
    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    const invalidFile = selected.find(
      (file) => !validTypes.includes(file.type),
    );

    if (invalidFile) {
      setError("Please upload JPG, PNG or WebP images only.");
      return;
    }

    const tooLarge = selected.find((file) => file.size > 5 * 1024 * 1024);

    if (tooLarge) {
      setError("Each photo must be 5 MB or smaller.");
      return;
    }

    setPhotos((current) => [
      ...current,
      ...selected.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      const photo = current[index];

      if (photo) URL.revokeObjectURL(photo.preview);

      return current.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!businessId) {
      setError("You need a registered business before adding a pet listing.");
      return;
    }

    if (photos.length === 0) {
      setError("Please upload at least one photo of the pet.");
      return;
    }

    if (listingType === "SALE" && (!price || Number(price) <= 0)) {
      setError("Enter a price greater than zero for a sale listing.");
      return;
    }

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      window.location.href = "/vendor/login";
      return;
    }

    const formData = new FormData();
    formData.append("business", businessId);
    formData.append("listing_type", listingType);
    formData.append("name", name.trim());
    formData.append("species", species.trim());
    formData.append("breed", breed.trim());
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("size", size);
    formData.append("description", description.trim());

    if (listingType === "SALE") {
      formData.append("price", price);
    }

    photos.forEach(({ file }) => {
      formData.append("images", file);
    });

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/pets/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setSuccess(
        "Your pet listing was submitted successfully. It may need approval before appearing publicly.",
      );

      photos.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setPhotos([]);
      setName("");
      setBreed("");
      setAge("");
      setDescription("");
      setPrice("");
      setListingType("ADOPTION");
      setSpecies("Dog");
      setGender("UNKNOWN");
      setSize("MEDIUM");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit your listing. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VendorLayout
      title="Add a pet listing"
      description="Share a new pet with the Pawdigree community."
    >
      <div className="vendor-pet-page">
        <a className="pet-back-link" href="/vendor/listings">
          <ArrowLeft size={17} />
          Back to catalogue
        </a>

        <form className="pet-listing-form" onSubmit={handleSubmit}>
          <section className="pet-form-section">
            <div className="pet-section-heading">
              <span className="pet-section-icon">
                <PawPrint size={20} />
              </span>
              <div>
                <h2>Pet information</h2>
                <p>Start with the basic details about this pet.</p>
              </div>
            </div>

            <label className="pet-field">
              Your business <span></span>
              <select
                value={businessId}
                onChange={(event) => setBusinessId(event.target.value)}
                disabled={loadingBusinesses || businesses.length === 0}
                required
              >
                <option value="">
                  {loadingBusinesses
                    ? "Loading your businesses..."
                    : "Select a business"}
                </option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>

            {!loadingBusinesses && businesses.length === 0 && (
              <p className="pet-inline-note">
                No registered business was found. Register your business before
                creating a listing.{" "}
                <a href="/business-registration">Register a business</a>
              </p>
            )}

            <div className="pet-field">
              <span className="pet-label">
                Listing type <span></span>
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
                Pet name <span></span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  placeholder="e.g. Bella"
                  required
                />
              </label>

              <label className="pet-field">
                Species <span></span>
                <input
                  value={species}
                  onChange={(event) => setSpecies(event.target.value)}
                  maxLength={100}
                  placeholder="e.g. Dog, Cat, Rabbit"
                  required
                />
              </label>

              <label className="pet-field">
                Breed
                <input
                  value={breed}
                  onChange={(event) => setBreed(event.target.value)}
                  maxLength={100}
                  placeholder="e.g. German Shepherd"
                />
              </label>

              <label className="pet-field">
                Age in months <span></span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="e.g. 8"
                  required
                />
              </label>

              <label className="pet-field">
                Gender <span></span>
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  required
                >
                  <option value="UNKNOWN">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </label>

              <label className="pet-field">
                Size <span></span>
                <select
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  required
                >
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </label>

              {listingType === "SALE" && (
                <label className="pet-field">
                  Price (UGX) <span></span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Enter sale price"
                    required
                  />
                </label>
              )}
            </div>

            <label className="pet-field">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder="Tell customers about this pet, its personality and care needs..."
              />
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
                  Upload multiple clear photos. The first photo will be the
                  primary image.
                </p>
              </div>
            </div>

            <label className="pet-upload-area">
              <ImagePlus size={30} />
              <strong>Choose pet photos</strong>
              <span>JPG, PNG or WebP · Maximum 5 MB per photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  addPhotos(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>

            {photos.length > 0 && (
              <div className="pet-photo-grid">
                {photos.map((photo, index) => (
                  <div className="pet-photo-card" key={photo.preview}>
                    <img src={photo.preview} alt={`Pet preview ${index + 1}`} />
                    {index === 0 && (
                      <span className="pet-primary-badge">Primary photo</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      aria-label={`Remove photo ${index + 1}`}
                      title="Remove photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="pet-photo-count">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}{" "}
              selected
            </p>
          </section>

          {error && (
            <p className="pet-form-message error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="pet-form-message success" role="status">
              {success}
            </p>
          )}

          <div className="pet-form-actions">
            <a href="/vendor/listings" className="pet-cancel-button">
              Cancel
            </a>
            <button
              className="pet-submit-button"
              type="submit"
              disabled={
                submitting || loadingBusinesses || businesses.length === 0
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle className="pet-spinner" size={18} />
                  Submitting...
                </>
              ) : (
                "Submit listing"
              )}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}

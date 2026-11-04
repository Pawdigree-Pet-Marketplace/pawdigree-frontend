import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Clock3,
  ImagePlus,
  Info,
  LoaderCircle,
  MapPin,
  Trash2,
  Wallet,
} from "lucide-react";
import BackButton from "../../components/BackButton/BackButton";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import "./VendorEditServicePage.css";

/* ------------------------------------------------------------------ */
/* Endpoints (from the API docs):                                      */
/*   GET    /api/services/{id}/  view one of my services               */
/*   PATCH  /api/services/{id}/  edit a service                        */
/*   DELETE /api/services/{id}/  remove a service                      */
/* ------------------------------------------------------------------ */
const SERVICES_URL = `${API_BASE_URL}/api/services/`;
const serviceUrl = (id: string) => `${SERVICES_URL}${id}/`;
const AFTER_SAVE_PATH = "/vendor/dashboard";

type ServiceStatus = "DRAFT" | "PENDING";
type ExistingPhoto = {
  id?: string | number;
  image_id?: number;
  image?: string;
  image_url?: string;
  url?: string;
};
type VendorService = {
  service_id?: number | string;
  id?: number | string;
  name?: string;
  description?: string;
  category?: string;
  price_type?: string;
  price?: string | number | null;
  duration?: number | null;
  service_area?: string;
  status?: string;
  images?: ExistingPhoto[];
};

const CATEGORIES = [
  { value: "GROOMING", label: "Grooming" },
  { value: "VET", label: "Vet" },
  { value: "BOARDING", label: "Boarding" },
  { value: "TRAINING", label: "Training" },
  { value: "OTHER", label: "Other" },
];
const PRICE_TYPES = [
  { value: "FIXED", label: "Fixed price" },
  { value: "HOURLY", label: "Per hour" },
];

async function readError(response: Response): Promise<string> {
  if (response.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (response.status === 403) {
    return "You don’t have permission to change this service.";
  }
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const text = Object.entries(data as Record<string, unknown>)
      .map(([field, value]) => {
        const messages = Array.isArray(value) ? value.join(" ") : String(value);
        return `${field}: ${messages}`;
      })
      .join("\n");
    if (text) return text;
  }
  return `Request failed (${response.status}).`;
}

const photoSrc = (p: ExistingPhoto) => p.image || p.image_url || p.url || "";

/* ------------------------------------------------------------------ */
/* Confirmation dialog                                                 */
/* ------------------------------------------------------------------ */
function ConfirmRemoveDialog({
  serviceName,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  serviceName: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(busy);
  const cancelHandlerRef = useRef(onCancel);

  useEffect(() => {
    busyRef.current = busy;
    cancelHandlerRef.current = onCancel;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busyRef.current) {
        cancelHandlerRef.current();
        return;
      }
      if (e.key === "Tab") {
        const first = cancelRef.current;
        const last = confirmRef.current;
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="edit-service-dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="edit-service-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-service-title"
        aria-describedby="remove-service-desc"
      >
        <span className="edit-service-dialog-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </span>
        <h2 id="remove-service-title">Remove this service?</h2>
        <p id="remove-service-desc">
          <strong>{serviceName || "This service"}</strong> will be taken off
          your profile and customers will no longer be able to book it. This
          can’t be undone.
        </p>
        {error && (
          <p className="edit-service-message error" role="alert">
            {error}
          </p>
        )}
        <div className="edit-service-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="edit-service-cancel-button"
            onClick={onCancel}
            disabled={busy}
          >
            Keep service
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="edit-service-danger-button solid"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <LoaderCircle className="edit-service-spinner" size={17} />
                Removing...
              </>
            ) : (
              "Remove service"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function VendorEditServicePage() {
  const { serviceId = "" } = useParams();
  const navigate = useNavigate();
  const id = serviceId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const redirectTimer = useRef<number | undefined>(undefined);

  const [loading, setLoading] = useState(Boolean(id));
  const [loadFailed, setLoadFailed] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [category, setCategory] = useState("");
  const [priceType, setPriceType] = useState("FIXED");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [description, setDescription] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>(
    [],
  );
  const [submitting, setSubmitting] = useState<ServiceStatus | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const newPhotosRef = useRef(newPhotos);
  useEffect(() => {
    newPhotosRef.current = newPhotos;
  }, [newPhotos]);

  const busy = submitting !== null || removing;
  const photoCount = existingPhotos.length + newPhotos.length;

  useEffect(() => {
    document.title = "Edit Service - Pawdigree";
    return () => {
      window.clearTimeout(redirectTimer.current);
      newPhotosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function loadService() {
      try {
        const res = await vendorAuthenticatedFetch(serviceUrl(id));
        if (!res.ok) {
          throw new Error(
            res.status === 404 ? "Service not found." : await readError(res),
          );
        }
        const service = (await res.json()) as VendorService;
        if (cancelled) return;
        setServiceName(service.name || "");
        setCategory(service.category || "");
        setPriceType(service.price_type || "FIXED");
        setPrice(service.price != null ? String(service.price) : "");
        setDuration(service.duration != null ? String(service.duration) : "");
        setServiceArea(service.service_area || "");
        setDescription(service.description || "");
        setExistingPhotos(service.images || []);
      } catch (err) {
        if (cancelled) return;
        setLoadFailed(true);
        setError(err instanceof Error ? err.message : "Service not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadService();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (selected.some((f) => !validTypes.includes(f.type))) {
      setError("Please upload JPG, PNG or WebP images only.");
      return;
    }
    if (selected.some((f) => f.size > 5 * 1024 * 1024)) {
      setError("Each photo must be 5 MB or smaller.");
      return;
    }
    setError("");
    setNewPhotos((curr) => [
      ...curr,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removeExistingPhoto(index: number) {
    const photo = existingPhotos[index];
    const photoId = photo?.image_id ?? photo?.id;
    if (photoId !== undefined) {
      setRemovedPhotoIds((curr) => [...curr, Number(photoId)]);
    }
    setExistingPhotos((curr) => curr.filter((_, i) => i !== index));
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((curr) => {
      const photo = curr[index];
      if (photo) URL.revokeObjectURL(photo.preview);
      return curr.filter((_, i) => i !== index);
    });
  }

  async function save(status: ServiceStatus) {
    setError("");
    setSuccess("");

    if (!serviceName.trim()) {
      setError("Add a service name before saving.");
      return;
    }
    if (status === "PENDING") {
      if (!description.trim()) {
        setError("Add a description before submitting for review.");
        return;
      }
      if (!price || Number(price) <= 0) {
        setError("Enter a price greater than zero.");
        return;
      }
      if (!duration || Number(duration) <= 0) {
        setError("Enter a duration greater than zero.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", serviceName.trim());
    formData.append("category", category);
    formData.append("price_type", priceType);
    formData.append("price", price);
    formData.append("duration", duration);
    formData.append("service_area", serviceArea.trim());
    formData.append("description", description.trim());
    formData.append("status", status);
    removedPhotoIds.forEach((photoId) =>
      formData.append("remove_image_ids", String(photoId)),
    );
    newPhotos.forEach(({ file }) => formData.append("images", file));

    setSubmitting(status);
    try {
      const res = await vendorAuthenticatedFetch(serviceUrl(id), {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) throw new Error(await readError(res));
      setSuccess(
        status === "DRAFT"
          ? "Draft saved."
          : "Submitted. Your changes are held for review before going live.",
      );
      redirectTimer.current = window.setTimeout(
        () => navigate(AFTER_SAVE_PATH),
        900,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your changes. Please try again.",
      );
      setSubmitting(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("PENDING");
  }

  async function removeService() {
    setRemoving(true);
    setRemoveError("");
    try {
      const res = await vendorAuthenticatedFetch(serviceUrl(id), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await readError(res));
      navigate(AFTER_SAVE_PATH, { replace: true });
    } catch (err) {
      setRemoveError(
        err instanceof Error
          ? err.message
          : "Could not remove this service. Please try again.",
      );
      setRemoving(false);
    }
  }

  /* ----------------------------- states ----------------------------- */
  if (loading) {
    return (
      <VendorLayout
        title="Edit service"
        description="Loading your service..."
        vendorWorkspace
      >
        <div
          className="dashboard-content vendor-edit-service-page"
          aria-busy="true"
        >
          <div className="edit-service-skeleton" />
          <div className="edit-service-skeleton short" />
        </div>
      </VendorLayout>
    );
  }

  if (loadFailed || !id) {
    return (
      <VendorLayout
        title="Edit service"
        description="We couldn’t open this service."
        vendorWorkspace
      >
        <div className="dashboard-content vendor-edit-service-page">
          <BackButton fallback="/vendor/dashboard" label="Back to dashboard" />
          <div className="edit-service-section">
            <h2 className="edit-service-empty-title">Service unavailable</h2>
            <p className="edit-service-empty-text">
              {error || "This service may have been removed."}
            </p>
            <Link to="/vendor/dashboard" className="edit-service-cancel-button">
              Go to dashboard
            </Link>
          </div>
        </div>
      </VendorLayout>
    );
  }

  /* ------------------------------ form ------------------------------ */
  return (
    <VendorLayout
      title="Edit service"
      description="Keep your service information accurate for customers."
      vendorWorkspace
    >
      <div className="dashboard-content vendor-edit-service-page">
        <BackButton fallback="/vendor/dashboard" label="Back to dashboard" />

        <form className="edit-service-form" onSubmit={handleSubmit}>
          <section className="edit-service-section edit-service-details">
            <div className="edit-service-heading">
              <span className="edit-service-icon">
                <BriefcaseBusiness size={20} />
              </span>
              <div>
                <h2>Service details</h2>
                <p>Update what customers see before they book.</p>
              </div>
            </div>

            <div className="edit-service-grid">
              <label className="edit-service-field full">
                <span className="edit-service-label">
                  Service name <i aria-hidden="true">*</i>
                </span>
                <input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Full grooming package"
                  autoComplete="off"
                  required
                />
              </label>

              <label className="edit-service-field">
                <span className="edit-service-label">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="edit-service-field">
                <span className="edit-service-label">Price type</span>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                >
                  {PRICE_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="edit-service-field">
                <span className="edit-service-label">
                  Price (UGX) <i aria-hidden="true">*</i>
                </span>
                <span className="edit-service-input-wrap">
                  <Wallet size={17} aria-hidden="true" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 50000"
                    required
                  />
                </span>
              </label>

              <label className="edit-service-field">
                <span className="edit-service-label">
                  Duration (minutes) <i aria-hidden="true">*</i>
                </span>
                <span className="edit-service-input-wrap">
                  <Clock3 size={17} aria-hidden="true" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 60"
                    required
                  />
                </span>
              </label>

              <label className="edit-service-field full">
                <span className="edit-service-label">Service area</span>
                <span className="edit-service-input-wrap">
                  <MapPin size={17} aria-hidden="true" />
                  <input
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    maxLength={160}
                    placeholder="e.g. Within 10 km of Kampala"
                    autoComplete="off"
                  />
                </span>
              </label>

              <label className="edit-service-field full">
                <span className="edit-service-label">
                  Description <i aria-hidden="true">*</i>
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Describe what the service includes and who it is for..."
                  required
                />
                <small>{description.length}/2000 characters</small>
              </label>
            </div>
          </section>

          <div className="edit-service-side">
            <aside className="edit-service-note" role="status">
              <Info size={20} aria-hidden="true" />
              <p>
                <strong>Pending changes.</strong> Edits are held for review
                before they go live. Your current listing stays visible until
                then.
              </p>
            </aside>

            <section className="edit-service-section">
              <div className="edit-service-heading">
                <span className="edit-service-icon">
                  <ImagePlus size={20} />
                </span>
                <div>
                  <h2>Photos</h2>
                  <p>
                    {photoCount === 0
                      ? "Add clear photos of your work."
                      : `${photoCount} ${photoCount === 1 ? "photo" : "photos"} · first is primary`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="edit-service-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={26} aria-hidden="true" />
                <strong>Add photos</strong>
                <span>JPG, PNG or WebP · Max 5 MB each</span>
              </button>
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

              {photoCount > 0 && (
                <div className="edit-service-photo-grid">
                  {existingPhotos.map((photo, index) => (
                    <div className="edit-service-photo" key={`ex-${index}`}>
                      <img src={photoSrc(photo)} alt="" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                      {index === 0 && (
                        <span className="edit-service-badge">Primary</span>
                      )}
                    </div>
                  ))}
                  {newPhotos.map((photo, index) => (
                    <div className="edit-service-photo" key={photo.preview}>
                      <img src={photo.preview} alt="" />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
                        aria-label={`Remove new photo ${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                      <span className="edit-service-badge new">New</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="edit-service-section edit-service-danger-zone">
              <h2>Remove service</h2>
              <p>
                Take this service off your profile. Customers won’t be able to
                book it any more.
              </p>
              <button
                type="button"
                className="edit-service-danger-button"
                onClick={() => {
                  setRemoveError("");
                  setConfirmOpen(true);
                }}
                disabled={busy}
              >
                <Trash2 size={16} aria-hidden="true" />
                Remove service
              </button>
            </section>
          </div>

          {error && (
            <p className="edit-service-message error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="edit-service-message success" role="status">
              {success}
            </p>
          )}

          <div className="edit-service-actions">
            <Link to="/vendor/dashboard" className="edit-service-cancel-button">
              Cancel
            </Link>
            <button
              type="button"
              className="edit-service-secondary-button"
              onClick={() => void save("DRAFT")}
              disabled={busy}
            >
              {submitting === "DRAFT" ? (
                <>
                  <LoaderCircle className="edit-service-spinner" size={17} />
                  Saving...
                </>
              ) : (
                "Save as draft"
              )}
            </button>
            <button
              className="edit-service-submit-button"
              type="submit"
              disabled={busy}
            >
              {submitting === "PENDING" ? (
                <>
                  <LoaderCircle className="edit-service-spinner" size={17} />
                  Submitting...
                </>
              ) : (
                "Submit for review"
              )}
            </button>
          </div>
        </form>
      </div>

      {confirmOpen && (
        <ConfirmRemoveDialog
          serviceName={serviceName}
          busy={removing}
          error={removeError}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void removeService()}
        />
      )}
    </VendorLayout>
  );
}

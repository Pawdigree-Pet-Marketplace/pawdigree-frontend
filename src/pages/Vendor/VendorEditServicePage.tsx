import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, BriefcaseBusiness, Clock3, ImagePlus, LoaderCircle, Trash2, Wallet, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { useVendorBusinesses } from "../../services/vendorBusinessStore";
import { categoryKindForBusinessType, getCategories, type Category } from "../../services/categoryService";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";
import { countWords } from "../../utils/petUtils";
import { getDescriptionErrorFromMessage, getListingDescriptionError, limitListingDescriptionWords, MAX_LISTING_DESCRIPTION_CHARACTERS, MAX_LISTING_DESCRIPTION_WORDS } from "../../utils/descriptionValidation";
import "./VendorEditServicePage.css";

type VendorService = {
  service_id?: number | string;
  id?: number | string;
  name?: string;
  service_type?: string;
  category?: string | number | null;
  description?: string;
  price?: string | number | null;
  duration?: number | null;
  availability_status?: "available" | "unavailable";
  image?: string | null;
  business?: string | number;
};

const serviceUrl = (id: string, businessId: string | null) =>
  `${API_BASE_URL}/api/services/${id}/${businessId ? `?business_id=${encodeURIComponent(businessId)}` : ""}`;
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

async function readError(response: Response): Promise<string> {
  if (response.status === 401) return "Your session has expired. Please log in again.";
  if (response.status === 403 || response.status === 404) return "You don’t have permission to change this service, or it is no longer available.";
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const text = Object.entries(data as Record<string, unknown>)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
      .join("\n");
    if (text) return text;
  }
  return `Request failed (${response.status}). Please try again.`;
}

export default function VendorEditServicePage() {
  const activeBusiness = useVendorBusiness();
  const { businesses } = useVendorBusinesses();
  const activeBusinessId = activeBusiness ? String(activeBusiness.id) : null;
  const { serviceId = "" } = useParams();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const cancelRemoveButton = useRef<HTMLButtonElement>(null);
  const confirmRemoveButton = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(Boolean(serviceId));
  const [loadFailed, setLoadFailed] = useState(!serviceId);
  const [service, setService] = useState<VendorService | null>(null);
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceBusinessId, setServiceBusinessId] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [availability, setAvailability] = useState<"available" | "unavailable">("available");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    document.title = "Edit Service - Pawdigree";
    let cancelled = false;
    async function load() {
      try {
        const response = await vendorAuthenticatedFetch(serviceUrl(serviceId, activeBusinessId));
        if (!response.ok) throw new Error(await readError(response));
        const data = await response.json() as VendorService;
        if (activeBusinessId && String(data.business) !== activeBusinessId) throw new Error("This service does not belong to the selected business.");
        if (cancelled) return;
        setService(data);
        setName(data.name ?? "");
        setServiceType(data.service_type ?? "");
        setServiceBusinessId(data.business == null ? "" : String(data.business));
        setCategory(data.category == null ? "" : String(data.category));
        setDescription(data.description ?? "");
        setPrice(data.price == null ? "" : String(data.price));
        setDuration(data.duration == null ? "" : String(data.duration));
        setAvailability(data.availability_status === "unavailable" ? "unavailable" : "available");
      } catch (reason) {
        if (!cancelled) {
          setLoadFailed(true);
          setError(reason instanceof Error ? reason.message : "Could not load this service.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (serviceId) void load();
    return () => { cancelled = true; };
  }, [serviceId, activeBusinessId]);

  const selectedBusiness = activeBusiness ?? businesses.find((business) => String(business.id) === serviceBusinessId);
  const categoryKind = categoryKindForBusinessType(selectedBusiness?.business_type);
  const serviceCategories = categories.filter((item) => item.is_active && item.kind === categoryKind);

  useEffect(() => {
    let cancelled = false;
    if (!categoryKind) return;
    getCategories(categoryKind)
      .then((items) => { if (!cancelled) setCategories(items); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load service categories."); })
    return () => { cancelled = true; };
  }, [selectedBusiness?.id, categoryKind]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!confirmOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRemoveButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !removing) setConfirmOpen(false);
      if (event.key !== "Tab") return;
      if (event.shiftKey && document.activeElement === cancelRemoveButton.current) {
        event.preventDefault(); confirmRemoveButton.current?.focus();
      } else if (!event.shiftKey && document.activeElement === confirmRemoveButton.current) {
        event.preventDefault(); cancelRemoveButton.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [confirmOpen, removing]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSuccess(""); setDescriptionError("");
    const validation = getListingDescriptionError(description);
    if (validation) { setDescriptionError(validation); return; }
    const fields = { name: name.trim(), service_type: serviceType.trim(), category, description: description.trim(), price, duration, availability_status: availability };
    const body: FormData | string = image
      ? (() => { const data = new FormData(); Object.entries(fields).forEach(([key, value]) => data.append(key, value)); data.append("image", image); return data; })()
      : JSON.stringify(fields);
    setSaving(true);
    try {
      const response = await vendorAuthenticatedFetch(serviceUrl(serviceId, activeBusinessId), {
        method: "PATCH",
        ...(image ? {} : { headers: { "Content-Type": "application/json" } }),
        body,
      });
      if (!response.ok) throw new Error(await readError(response));
      setSuccess("Your service changes were saved.");
      setImage(null);
      setPreview("");
      const updated = await response.json().catch(() => null) as VendorService | null;
      if (updated) setService(updated);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not save your changes. Please try again.";
      setDescriptionError(getDescriptionErrorFromMessage(message) ?? "");
      setError(message);
    } finally { setSaving(false); }
  }

  async function removeService() {
    setRemoving(true); setRemoveError("");
    try {
      const response = await vendorAuthenticatedFetch(serviceUrl(serviceId, activeBusinessId), { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response));
      navigate(activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "dashboard") : "/vendor/dashboard", { replace: true });
    } catch (reason) {
      setRemoveError(reason instanceof Error ? reason.message : "Could not remove this service.");
      setRemoving(false);
      setConfirmOpen(false);
    }
  }

  if (loading) return <VendorLayout title="Edit service" description="Loading your service..." vendorWorkspace><div className="dashboard-content vendor-edit-service-page" aria-busy="true"><div className="edit-service-skeleton" /></div></VendorLayout>;
  if (loadFailed || !service) return <VendorLayout title="Edit service" description="We couldn’t open this service." vendorWorkspace><div className="dashboard-content vendor-edit-service-page"><BackButton fallback={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "dashboard") : "/vendor/dashboard"} label="Back to dashboard" /><section className="edit-service-section"><h2 className="edit-service-empty-title">Service unavailable</h2><p className="edit-service-empty-text">{error || "This service may have been removed."}</p><Link to="/vendor/dashboard" className="edit-service-cancel-button">Go to dashboard</Link></section></div></VendorLayout>;

  return <VendorLayout title="Edit service" description="Keep your service information accurate for customers." vendorWorkspace>
    <div className="dashboard-content vendor-edit-service-page">
      <BackButton fallback={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "dashboard") : "/vendor/dashboard"} label="Back to dashboard" />
      <form className="edit-service-form" onSubmit={(event) => void save(event)}>
        <section className="edit-service-section edit-service-details">
          <div className="edit-service-heading"><span className="edit-service-icon"><BriefcaseBusiness size={20} /></span><div><h2>Service details</h2><p>Update the information customers see.</p></div></div>
          <div className="edit-service-grid">
            <label className="edit-service-field full"><span className="edit-service-label">Service name <i aria-hidden="true">*</i></span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={150} required /></label>
            <label className="edit-service-field"><span className="edit-service-label">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} disabled={serviceCategories.length === 0} required><option value="">{serviceCategories.length === 0 ? "Loading categories..." : "Select a category"}</option>{serviceCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="edit-service-field"><span className="edit-service-label">Service type</span><input value={serviceType} onChange={(event) => setServiceType(event.target.value)} maxLength={100} /></label>
            <label className="edit-service-field"><span className="edit-service-label">Price (UGX) <i aria-hidden="true">*</i></span><span className="edit-service-input-wrap"><Wallet size={17} aria-hidden="true" /><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></span></label>
            <label className="edit-service-field"><span className="edit-service-label">Duration (minutes) <i aria-hidden="true">*</i></span><span className="edit-service-input-wrap"><Clock3 size={17} aria-hidden="true" /><input type="number" min="1" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} required /></span></label>
            <label className="edit-service-field"><span className="edit-service-label">Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value as "available" | "unavailable")}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
            <label className="edit-service-field full"><span className="edit-service-label">Description <i aria-hidden="true">*</i></span><textarea value={description} onChange={(event) => { const limited = limitListingDescriptionWords(event.target.value); setDescription(limited); setDescriptionError(limited === event.target.value ? "" : "Description is limited to 300 words."); }} rows={5} maxLength={MAX_LISTING_DESCRIPTION_CHARACTERS} aria-describedby="edit-service-description-count edit-service-description-error" aria-invalid={Boolean(descriptionError)} required /><small id="edit-service-description-count">{countWords(description)} / {MAX_LISTING_DESCRIPTION_WORDS} words</small>{descriptionError && <small id="edit-service-description-error" className="field-error" role="alert">{descriptionError}</small>}</label>
          </div>
        </section>
        <aside className="edit-service-side">
          <section className="edit-service-section">
            <div className="edit-service-heading"><span className="edit-service-icon"><ImagePlus size={20} /></span><div><h2>Service image</h2><p>One image · JPEG, PNG or WebP · Max 5 MB</p></div></div>
            {!preview && service.image && <div className="edit-service-photo"><img src={service.image} alt={`${name} current service image`} /></div>}
            {preview && <div className="edit-service-photo"><img src={preview} alt={`Preview of ${image?.name ?? name}`} /><button type="button" onClick={() => { setImage(null); setPreview(""); }} aria-label="Remove replacement image"><X size={15} /></button><span className="edit-service-badge new">New image</span></div>}
            <button type="button" className="edit-service-upload" onClick={() => fileInput.current?.click()}><ImagePlus size={24} aria-hidden="true" /><strong>{service.image ? "Replace image" : "Choose image"}</strong><span>The current image stays until you replace it.</span></button>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose replacement service image" hidden onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (!file) return; if (!imageTypes.includes(file.type)) { setError("Choose a JPEG, PNG or WebP image."); return; } if (file.size > maxImageSize) { setError("The service image must be 5 MB or smaller."); return; } setError(""); setImage(file); setPreview(URL.createObjectURL(file)); }} />
          </section>
          <section className="edit-service-section edit-service-danger-zone"><h2>Remove service</h2><p>Take this service off your profile.</p><button type="button" className="edit-service-danger-button" disabled={saving || removing} onClick={() => { setRemoveError(""); setConfirmOpen(true); }}><Trash2 size={16} />Remove service</button></section>
        </aside>
        {error && <p className="edit-service-message error" role="alert">{error}</p>}
        {success && <p className="edit-service-message success" role="status">{success}</p>}
        <div className="edit-service-actions"><Link to="/vendor/dashboard" className="edit-service-cancel-button">Cancel</Link><button className="edit-service-submit-button" type="submit" disabled={saving || removing}>{saving ? <><LoaderCircle className="edit-service-spinner" size={17} /> Saving...</> : "Save changes"}</button></div>
      </form>
      {confirmOpen && <div className="edit-service-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !removing) setConfirmOpen(false); }}><div className="edit-service-dialog" role="alertdialog" aria-modal="true" aria-labelledby="remove-service-title" aria-describedby="remove-service-description"><span className="edit-service-dialog-icon"><AlertTriangle size={22} /></span><h2 id="remove-service-title">Remove this service?</h2><p id="remove-service-description">{name} will be taken off your profile and customers will no longer see it.</p>{removeError && <p className="edit-service-message error" role="alert">{removeError}</p>}<div className="edit-service-dialog-actions"><button ref={cancelRemoveButton} type="button" className="edit-service-cancel-button" disabled={removing} onClick={() => setConfirmOpen(false)}>Keep service</button><button ref={confirmRemoveButton} type="button" className="edit-service-danger-button solid" disabled={removing} onClick={() => void removeService()}>{removing ? "Removing..." : "Remove service"}</button></div></div></div>}
    </div>
  </VendorLayout>;
}

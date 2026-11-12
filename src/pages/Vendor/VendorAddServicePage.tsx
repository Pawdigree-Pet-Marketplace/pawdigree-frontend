import { useEffect, useState, type FormEvent } from "react";
import { BriefcaseBusiness, Clock3, Info, LoaderCircle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import API_BASE_URL from "../../services/api";
import { getCategories, type Category } from "../../services/categoryService";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";
import "./VendorAddServicePage.css";

type Business = { id: string; name: string };
type BusinessResponse = Business[] | { results?: Business[] };
type ServiceResponse = { category_status?: string };

async function readError(response: Response): Promise<string> {
  if (response.status === 401) return "Your session has expired. Please log in again.";
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const message = Object.entries(data as Record<string, unknown>)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
      .join("\n");
    if (message) return message;
  }
  return `Request failed (${response.status}). Please try again.`;
}

export default function VendorAddServicePage() {
  const activeBusiness = useVendorBusiness();
  const activeBusinessId = activeBusiness ? String(activeBusiness.id) : null;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [loadedForBusinessId, setLoadedForBusinessId] = useState<string | null | undefined>(undefined);
  const loading = loadedForBusinessId !== activeBusinessId;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectedBusinessId = activeBusinessId ?? businessId;

  useEffect(() => {
    document.title = "Add Service - Pawdigree";
    let cancelled = false;

    async function loadOptions() {
      try {
        const [businessResponse, categoryOptions] = await Promise.all([
          activeBusinessId === null
            ? vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/`)
            : Promise.resolve(null),
          getCategories(),
        ]);
        if (businessResponse) {
          if (!businessResponse.ok) throw new Error(await readError(businessResponse));
          const data = (await businessResponse.json()) as BusinessResponse;
          const businessOptions = Array.isArray(data) ? data : data.results ?? [];
          if (cancelled) return;
          setBusinesses(businessOptions);
          setBusinessId(businessOptions[0]?.id ?? "");
        }
        if (cancelled) return;
        setCategories(categoryOptions);
        setCategoryId(categoryOptions[0] ? String(categoryOptions[0].id) : "");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load service options.");
      } finally {
        if (!cancelled) setLoadedForBusinessId(activeBusinessId);
      }
    }

    void loadOptions();
    return () => { cancelled = true; };
  }, [activeBusinessId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const selectedCategory = categories.find((item) => String(item.id) === categoryId);
    if (!selectedBusinessId || !selectedCategory) {
      setError("Select a business and service category before saving.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/services/${activeBusinessId !== null ? `?business_id=${encodeURIComponent(selectedBusinessId)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: selectedBusinessId,
          category: selectedCategory.id,
          name: serviceName.trim(),
          service_type: selectedCategory.name,
          description: description.trim(),
          price,
          duration: Number(duration),
          availability_status: "available",
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const created = (await response.json().catch(() => ({}))) as ServiceResponse;
      setSuccess(created.category_status === "pending"
        ? "Your service was saved. Its category is pending approval and will be available to customers once approved."
        : "Your service was saved successfully.");
      setServiceName("");
      setDescription("");
      setPrice("");
      setDuration("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasFormOptions = (activeBusinessId !== null || businesses.length > 0) && categories.length > 0;

  return (
    <VendorLayout title="Add a service" description="Tell customers about the care and services your business offers." vendorWorkspace>
      <div className="dashboard-content vendor-service-page">
        <BackButton fallback={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "dashboard") : "/vendor/dashboard"} label="Back to dashboard" />
        <form className="service-listing-form" onSubmit={handleSubmit}>
          <section className="service-form-section">
            <div className="service-section-heading">
              <span className="service-section-icon"><BriefcaseBusiness size={20} /></span>
              <div><h2>Service details</h2><p>Give customers the key details they need before booking.</p></div>
            </div>

            {loading && <p className="service-form-message" role="status">Loading your businesses and service categories...</p>}
            {!activeBusiness && <label className="service-field">
              Your business <span aria-hidden="true"></span>
              <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} disabled={loading || businesses.length === 0} required>
                <option value="">{loading ? "Loading businesses..." : "Select a business"}</option>
                {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
              </select>
            </label>}
            {!activeBusiness && !loading && businesses.length === 0 && <p className="service-inline-note">Register a business before adding a service. <Link to="/business-registration">Register a business</Link></p>}

            <label className="service-field">
              Service category <span aria-hidden="true"></span>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={loading || categories.length === 0} required>
                <option value="">{loading ? "Loading categories..." : "Select a category"}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            {!loading && categories.length === 0 && !error && <p className="service-inline-note">No service categories are available yet. Please try again later.</p>}

            <label className="service-field">
              Service name <span aria-hidden="true"></span>
              <input value={serviceName} onChange={(event) => setServiceName(event.target.value)} maxLength={150} placeholder="e.g. Full dog grooming" autoComplete="off" required />
            </label>
            <label className="service-field">
              Description <span aria-hidden="true"></span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} maxLength={2000} placeholder="Describe what the service includes and who it is for..." required />
              <small>{description.length}/2000 characters</small>
            </label>
            <div className="service-form-grid">
              <label className="service-field">
                Price (UGX) <span aria-hidden="true"></span>
                <span className="service-input-wrap"><Wallet size={17} aria-hidden="true" />
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="e.g. 50000" required />
                </span>
              </label>
              <label className="service-field">
                Duration (minutes) <span aria-hidden="true"></span>
                <span className="service-input-wrap"><Clock3 size={17} aria-hidden="true" />
                  <input type="number" min="1" step="1" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="e.g. 60" required />
                </span>
              </label>
            </div>
          </section>

          <aside className="service-unavailable-note" role="note">
            <Info size={20} aria-hidden="true" />
            <p>New service categories are requested for approval automatically. Customers can find the service when its category and business are approved.</p>
          </aside>

          {error && <p className="service-form-message error" role="alert">{error}</p>}
          {success && <p className="service-form-message success" role="status">{success}</p>}
          <div className="service-form-actions">
            <Link to="/vendor/dashboard" className="service-cancel-button">Cancel</Link>
            <button className="service-submit-button" type="submit" disabled={loading || submitting || !hasFormOptions}>
              {submitting ? <><LoaderCircle className="service-spinner" size={18} /> Saving...</> : "Save service"}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}

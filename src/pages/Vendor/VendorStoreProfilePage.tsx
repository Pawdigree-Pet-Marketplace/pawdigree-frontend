import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, LoaderCircle, Store } from "lucide-react";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import VendorBusinessUpdateForm, { type Business } from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import type { VendorBusiness } from "../../services/vendorBusinessStore";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import API_BASE_URL from "../../services/api";
import "./VendorStoreProfilePage.css";

function imageUrl(path?: string | null) {
  if (!path) return "";
  return /^(https?:|data:|blob:)/i.test(path) ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function VendorStoreProfilePage() {
  const routeBusiness = useVendorBusiness();
  return <StoreProfileContent key={routeBusiness?.id ?? "no-business"} routeBusiness={routeBusiness} />;
}

function StoreProfileContent({ routeBusiness }: { routeBusiness: VendorBusiness | null }) {
  const routeBusinessId = routeBusiness?.id ?? null;
  const [business, setBusiness] = useState<Business | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(Boolean(routeBusiness));
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<"logo" | "cover_image" | "">("");
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (routeBusinessId === null) return;
    let cancelled = false;
    vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/${encodeURIComponent(routeBusinessId)}/`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 403 || response.status === 404 ? "This business is not available to your account." : "Could not load the selected business.");
        const data = (await response.json()) as Business;
        if (!cancelled) setBusiness(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load the selected business.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [routeBusinessId]);

  async function uploadImage(file: File, field: "logo" | "cover_image") {
    if (!business?.id) return;
    setUploadMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadMessage("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage("The image must be 5 MB or smaller.");
      return;
    }
    setUploading(field);
    const body = new FormData();
    body.append(field, file);
    try {
      const response = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/${encodeURIComponent(String(business.id))}/`, { method: "PATCH", body });
      if (!response.ok) throw new Error(`Image upload failed (${response.status}).`);
      setBusiness((await response.json()) as Business);
      setUploadMessage("Image updated.");
    } catch (reason) {
      setUploadMessage(reason instanceof Error ? reason.message : "Could not upload the image.");
    } finally {
      setUploading("");
    }
  }

  const hours = business?.business_hours && typeof business.business_hours === "object"
    ? Object.entries(business.business_hours as Record<string, unknown>)
    : [];

  return (
    <VendorLayout title="Store Profile" description="View and update the selected business profile." businessName={business?.name || routeBusiness?.name || "Your store"} vendorWorkspace>
      <main className="vendor-store-profile">
        {!routeBusiness ? (
          <section className="vsp-empty">
            <Store size={28} aria-hidden="true" />
            <h2>Select a business to view its Store Profile</h2>
            <p>Choose a business from the workspace selector, or open Businesses to select or register one.</p>
            <Link to="/vendor/business-profile">Go to Businesses</Link>
          </section>
        ) : loading ? (
          <section className="vsp-empty" role="status">Loading selected business…</section>
        ) : error ? (
          <section className="vsp-empty" role="alert"><h2>Store Profile unavailable</h2><p>{error}</p><Link to="/vendor/business-profile">Open Businesses</Link></section>
        ) : business ? (
          <>
            <section className="vsp-hero">
              <div className="vsp-cover" style={business.cover_image ? { backgroundImage: `url("${imageUrl(business.cover_image)}")` } : undefined}>
                {!business.cover_image && <Store size={34} aria-hidden="true" />}
                <label className="vsp-image-button">
                  {uploading === "cover_image" ? <LoaderCircle size={16} className="vsp-spinner" /> : <ImagePlus size={16} />}
                  <span>{business.cover_image ? "Change cover" : "Add cover"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadImage(file, "cover_image"); }} />
                </label>
              </div>
              <div className="vsp-heading">
                <div className="vsp-logo">{business.logo ? <img src={imageUrl(business.logo)} alt="Business logo" /> : <Store size={24} aria-hidden="true" />}</div>
                <div className="vsp-title"><h2>{business.name || "Business"}</h2><span className={`vsp-status vsp-status-${(business.verification_status || "draft").toLowerCase()}`}>{(business.verification_status || "draft").replaceAll("_", " ")}</span></div>
                <label className="vsp-image-button vsp-logo-button">
                  {uploading === "logo" ? <LoaderCircle size={16} className="vsp-spinner" /> : <ImagePlus size={16} />}
                  <span>{business.logo ? "Change logo" : "Add logo"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadImage(file, "logo"); }} />
                </label>
                {!editing && <button className="vsp-edit" type="button" onClick={() => setEditing(true)}>Edit profile</button>}
              </div>
            </section>
            {uploadMessage && <p className="vsp-message" role="status">{uploadMessage}</p>}
            {editing ? (
              <VendorBusinessUpdateForm key={String(business.id)} business={business} showCategory={false} onSaved={(saved) => { setBusiness(saved); setEditing(false); }} onCancel={() => setEditing(false)} />
            ) : (
              <section className="vsp-details">
                <h3>Business details</h3>
                <dl>
                  <div><dt>Description</dt><dd>{business.description || "Not provided"}</dd></div>
                  <div><dt>Contact</dt><dd>{business.contact || "Not provided"}</dd></div>
                  <div><dt>Email</dt><dd>{business.email || "Not provided"}</dd></div>
                  <div><dt>Address</dt><dd>{business.address || "Not provided"}</dd></div>
                  <div><dt>City / district</dt><dd>{business.city_district || "Not provided"}</dd></div>
                  <div className="vsp-hours"><dt>Business hours</dt><dd>{hours.length ? hours.map(([day, value]) => {
                    const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
                    const text = item.is_open === false ? "Closed" : `${String(item.open || "")} – ${String(item.close || "")}`;
                    return <span key={day}><b>{day}</b>{text}</span>;
                  }) : "Not provided"}</dd></div>
                </dl>
              </section>
            )}
          </>
        ) : null}
      </main>
    </VendorLayout>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import "./VendorProfilePage.css";

type VendorProfile = {
  username: string; first_name: string; last_name: string; email: string; phone: string;
  businesses: { id: string; name: string; verification_status: string }[];
};
type BusinessList = VendorProfile["businesses"] | { results?: VendorProfile["businesses"] };

export default function VendorProfilePage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      vendorAuthenticatedFetch(`${API_BASE_URL}/api/auth/current-user/`),
      vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/`),
    ])
      .then(async ([profileResponse, businessesResponse]) => {
        if (!profileResponse.ok || !businessesResponse.ok) throw new Error(profileResponse.status === 401 || businessesResponse.status === 401 ? "Your session has expired. Please log in again." : "Could not load your profile.");
        const [data, businessData] = await Promise.all([profileResponse.json() as Promise<VendorProfile>, businessesResponse.json() as Promise<BusinessList>]);
        const businesses = Array.isArray(businessData) ? businessData : businessData.results ?? [];
        return { ...data, businesses };
      })
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load your profile."); });
    return () => { cancelled = true; };
  }, []);
  return <VendorLayout title="My Profile" description="Your personal vendor account and associated businesses." vendorWorkspace>
    <main className="dashboard-content vendor-personal-profile">
      {error && <p className="catalogue-error" role="alert">{error}</p>}
      {!profile && !error && <p role="status">Loading your profile…</p>}
      {profile && <>
        <section className="vendor-profile-card">
          <span className="vendor-profile-avatar"><UserRound size={30} aria-hidden="true" /></span>
          <div><h2>{`${profile.first_name} ${profile.last_name}`.trim() || profile.username}</h2><p>Personal vendor account</p></div>
        </section>
        <section className="vendor-profile-card"><h2>Account details</h2><dl><div><dt>Name</dt><dd>{`${profile.first_name} ${profile.last_name}`.trim() || profile.username}</dd></div><div><dt>Email</dt><dd>{profile.email}</dd></div><div><dt>Phone</dt><dd>{profile.phone || "Not provided"}</dd></div></dl></section>
        <section className="vendor-profile-card"><h2>My Businesses</h2>{profile.businesses.length ? <ul>{profile.businesses.map((business) => <li key={business.id}><Link to={`/vendor/business/${business.id}/dashboard`}>{business.name}</Link><span>{business.verification_status.replaceAll("_", " ").toLowerCase()}</span></li>)}</ul> : <p>No businesses are associated with this account yet.</p>}</section>
      </>}
    </main>
  </VendorLayout>;
}

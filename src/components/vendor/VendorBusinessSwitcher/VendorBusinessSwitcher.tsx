import { useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, ChevronDown, House } from "lucide-react";
import { activeBusinessIdFromPath, vendorBusinessPath } from "../../../services/vendorBusinessRoutes";
import { useVendorBusinesses, type VendorBusiness } from "../../../services/vendorBusinessStore";
import "./VendorBusinessSwitcher.css";

export function VendorBusinessList({ businesses, loading, error }: { businesses: VendorBusiness[]; loading: boolean; error: string }) {
  const navigate = useNavigate();
  return <section className="dashboard-panel dashboard-businesses-panel" aria-labelledby="dashboard-businesses-title" data-vendor-tour="businesses">
    <div className="dashboard-businesses-heading">
      <div><BriefcaseBusiness size={18} aria-hidden="true" /><h2 id="dashboard-businesses-title">MY BUSINESSES</h2></div>
      <Link to="/vendor/business-profile">Manage businesses <span aria-hidden="true">↗</span></Link>
    </div>
    {loading ? <p className="dashboard-merchandise-message" role="status">Loading your businesses…</p> : error ? <p className="dashboard-merchandise-message" role="status">Your businesses could not be loaded.</p> : businesses.length === 0 ? <p className="dashboard-merchandise-message">No businesses registered yet.</p> : <ul className="dashboard-business-list">
      {businesses.map((business) => <li key={business.id}><button type="button" onClick={() => navigate(vendorBusinessPath(String(business.id), "dashboard"))}>
        <span className="dashboard-business-name">{business.name}</span>
        <span className={`dashboard-business-status is-${String(business.verification_status ?? "unknown").toLowerCase().replace(/[^a-z]+/g, "-")}`}>{String(business.verification_status ?? "Status unavailable").replaceAll("_", " ")}</span>
        {business.is_active === false && <span className="dashboard-business-status is-inactive">Inactive</span>}
        <span className="dashboard-business-selection">Open dashboard</span>
      </button></li>)}
    </ul>}
  </section>;
}

export default function VendorBusinessSwitcher() {
  const { businesses, loading, error } = useVendorBusinesses();
  const location = useLocation();
  const navigate = useNavigate();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const activeId = activeBusinessIdFromPath(location.pathname);
  const activeBusiness = businesses.find((business) => String(business.id) === activeId);
  const suffix = useMemo(() => {
    if (!activeId) return "dashboard";
    return location.pathname.slice(`/vendor/business/${encodeURIComponent(activeId)}/`.length) || "dashboard";
  }, [activeId, location.pathname]);

  function switchBusiness(nextId: string) {
    if (!nextId) return;
    const nextBusiness = businesses.find((business) => String(business.id) === nextId);
    const unsupportedAvailability = suffix === "availability"
      && nextBusiness?.business_type !== "SERVICE_PROVIDER";
    const page = unsupportedAvailability || /^(edit-pet\/|services\/[^/]+\/(edit|availability))/.test(suffix)
      ? "dashboard"
      : suffix;
    navigate(vendorBusinessPath(nextId, page));
    if (detailsRef.current) detailsRef.current.open = false;
  }

  function switchToMainDashboard() {
    navigate("/vendor/dashboard");
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details className="vendor-business-switcher" ref={detailsRef}>
      <summary aria-label={activeBusiness ? `Switch business. Current business: ${activeBusiness.name}` : "Choose a business"} title={activeBusiness?.name || "Choose a business"}>
        <House size={18} aria-hidden="true" />
        <ChevronDown className="vendor-business-switcher-chevron" size={12} aria-hidden="true" />
      </summary>
      <div className="vendor-business-switcher-menu" role="menu" aria-label="Your businesses">
        <p className="vendor-business-switcher-heading">Switch business</p>
        <button
          className={`vendor-business-switcher-option vendor-business-switcher-option--main${!activeId ? " is-selected" : ""}`}
          type="button"
          role="menuitemradio"
          aria-checked={!activeId}
          onClick={switchToMainDashboard}
        >
          <House size={16} aria-hidden="true" />
          <span>Main Vendor Dashboard</span>
          {!activeId && <span className="vendor-business-switcher-current">Current</span>}
        </button>
        {loading ? <p className="vendor-business-switcher-note">Loading businesses…</p> : businesses.length ? businesses.map((business) => {
          const id = String(business.id);
          const selected = id === activeId;
          return <button className={`vendor-business-switcher-option${selected ? " is-selected" : ""}`} type="button" role="menuitemradio" aria-checked={selected} key={id} onClick={() => switchBusiness(id)}>
            <BriefcaseBusiness size={16} aria-hidden="true" />
            <span>{business.name}</span>
            {selected && <span className="vendor-business-switcher-current">Current</span>}
          </button>;
        }) : <p className="vendor-business-switcher-note">No businesses yet.</p>}
        {error && <p className="vendor-business-switcher-error" role="status">{error}</p>}
        <button className="vendor-business-switcher-manage" type="button" onClick={() => { navigate(activeId ? vendorBusinessPath(activeId, "businesses") : "/vendor/business-profile"); if (detailsRef.current) detailsRef.current.open = false; }}>
          Manage businesses
        </button>
      </div>
    </details>
  );
}

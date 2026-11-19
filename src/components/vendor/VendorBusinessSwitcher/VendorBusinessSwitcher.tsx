import { useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, ChevronDown, House } from "lucide-react";
import { activeBusinessIdFromPath, vendorBusinessPath } from "../../../services/vendorBusinessRoutes";
import { useVendorBusinesses } from "../../../services/vendorBusinessStore";
import "./VendorBusinessSwitcher.css";

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
    const page = /^(edit-pet\/|services\/[^/]+\/(edit|availability))/.test(suffix)
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

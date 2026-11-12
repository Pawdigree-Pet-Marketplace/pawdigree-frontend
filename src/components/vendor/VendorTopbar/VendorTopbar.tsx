import { Bell, Search, Store } from "lucide-react";
import { Link } from "react-router-dom";
import "./VendorTopbar.css";
import { useVendorBusiness } from "../../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../../services/vendorBusinessRoutes";
import VendorBusinessSwitcher from "../VendorBusinessSwitcher/VendorBusinessSwitcher";

type VendorTopbarProps = {
  businessName?: string;
  onSearch?: (query: string) => void;
  showBusinessSwitcher?: boolean;
};

export default function VendorTopbar({
  businessName = "Your store",
  onSearch,
  showBusinessSwitcher = false,
}: VendorTopbarProps) {
  const activeBusiness = useVendorBusiness();
  return (
    <div className="dashboard-header-actions">
      <label className="dashboard-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search your store..."
          aria-label="Search your store"
          onChange={(event) => onSearch?.(event.target.value)}
        />
      </label>

      {showBusinessSwitcher && <VendorBusinessSwitcher />}

      <button
        type="button"
        className="dashboard-notification-button"
        aria-label="Notifications are not available yet"
        title="Notifications are not available yet"
        disabled
      >
        <Bell size={18} aria-hidden="true" />
      </button>

      <Link
        to={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "store-profile") : "/vendor/profile"}
        className="dashboard-avatar"
        aria-label={`${businessName} business profile`}
        title="Business profile"
      >
        <Store size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}

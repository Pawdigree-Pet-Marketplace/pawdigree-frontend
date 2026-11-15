import { Bell, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import "./VendorTopbar.css";
import VendorBusinessSwitcher from "../VendorBusinessSwitcher/VendorBusinessSwitcher";

type VendorTopbarProps = {
  businessName?: string;
  onSearch?: (query: string) => void;
  showBusinessSwitcher?: boolean;
};

export default function VendorTopbar({
  onSearch,
  showBusinessSwitcher = false,
}: VendorTopbarProps) {
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
        to="/vendor/profile"
        className="dashboard-avatar"
        aria-label="My vendor profile"
        title="My profile"
      >
        <UserRound size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}

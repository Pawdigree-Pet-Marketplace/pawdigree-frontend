import { Bell, Search, Store, Menu } from "lucide-react";
import "./VendorTopbar.css";

type VendorTopbarProps = {
  businessName?: string;
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
};

export default function VendorTopbar({
  businessName = "Your store",
  onSearch,
  onMenuToggle,
}: VendorTopbarProps) {
  return (
    <div className="dashboard-header-actions">
      <button
        type="button"
        className="vendor-hamburger-btn"
        aria-label="Open menu"
        onClick={onMenuToggle}
      >
        <Menu size={20} />
      </button>
      <label className="dashboard-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search your store..."
          aria-label="Search your store"
          onChange={(event) => onSearch?.(event.target.value)}
        />
      </label>

      <button
        type="button"
        className="dashboard-notification-button"
        aria-label="Notifications are not available yet"
        title="Notifications are not available yet"
        disabled
      >
        <Bell size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="dashboard-avatar"
        aria-label={`${businessName} profile is not available yet`}
        title="Store profile is not available yet"
        disabled
      >
        <Store size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

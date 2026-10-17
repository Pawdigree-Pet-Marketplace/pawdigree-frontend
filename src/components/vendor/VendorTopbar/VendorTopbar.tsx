import { Bell, Search, Store } from "lucide-react";
import "./VendorTopbar.css";

type VendorTopbarProps = {
  businessName?: string;
  onSearch?: (query: string) => void;
};

export default function VendorTopbar({
  businessName = "Your store",
  onSearch,
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

      <button
        type="button"
        className="dashboard-notification-button"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => {
          window.location.href = "/vendor/notifications";
        }}
      >
        <Bell size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="dashboard-avatar"
        aria-label={`Open ${businessName} profile`}
        title={businessName}
        onClick={() => {
          window.location.href = "/vendor/profile";
        }}
      >
        <Store size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

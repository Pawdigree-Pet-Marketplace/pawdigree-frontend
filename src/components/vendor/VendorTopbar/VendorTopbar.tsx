import { CircleHelp, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import "./VendorTopbar.css";
import VendorBusinessSwitcher from "../VendorBusinessSwitcher/VendorBusinessSwitcher";
import { useVendorBusiness } from "../../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../../services/vendorBusinessRoutes";

type VendorTopbarProps = {
  businessName?: string;
  onSearch?: (query: string) => void;
  showBusinessSwitcher?: boolean;
};

export default function VendorTopbar({
  onSearch,
  showBusinessSwitcher = false,
}: VendorTopbarProps) {
  const activeBusiness = useVendorBusiness();
  const profilePath = activeBusiness
    ? vendorBusinessPath(String(activeBusiness.id), "profile")
    : "/vendor/profile";

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

      <Link to="/vendor/dashboard?tour=replay" className="dashboard-notification-button vendor-tour-replay" aria-label="Replay dashboard tour" title="Replay dashboard tour"><CircleHelp size={18} aria-hidden="true" /></Link>

      <Link
        to={profilePath}
        className="dashboard-avatar"
        aria-label="My vendor profile"
        title="My profile"
      >
        <UserRound size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}

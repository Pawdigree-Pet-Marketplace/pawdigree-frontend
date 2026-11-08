import {
  Activity,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Headset,
  FileText,
  BriefcaseBusiness,
} from "lucide-react";
import "./VendorSidebar.css";
import lightModeLogo from "../../../assets/logos/lightmode-logo.svg";
import iconLogo from "../../../assets/logos/icon-logo.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../../services/auth/authStorage";

const implementedVendorPages = new Set([
  "/vendor/dashboard",
  "/vendor/listings",
  "/vendor/adoption-applications",
  "/vendor/services/new",
  "/vendor/business-profile",
]);

const navigationGroups = [
  {
    title: "WORKSPACE",
    items: [
      { label: "Dashboard", path: "/vendor/dashboard", icon: LayoutDashboard },
      {
        label: "Sales & Payouts",
        path: "/vendor/sales",
        icon: ChartNoAxesCombined,
      },
    ],
  },
  {
    title: "YOUR STORE",
    items: [
      { label: "Catalogue", path: "/vendor/listings", icon: Package },
      {
        label: "Adoption applications",
        path: "/vendor/adoption-applications",
        icon: FileText,
      },
      {
        label: "Add Service",
        path: "/vendor/services/new",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    title: "CUSTOMER CARE",
    items: [
      { label: "Orders & Bookings", path: "/vendor/orders", icon: ShoppingBag },
      {
        label: "Customers & Messages",
        path: "/vendor/customers",
        icon: MessageCircle,
      },
      {
        label: "Availability",
        path: "/vendor/availability",
        icon: CalendarDays,
      },
    ],
  },
  {
  
  title: "BUSINESS",
  items: [
    { label: "Store Profile", path: "/vendor/profile", icon: Store },
    {
      label: "Businesses",
      path: "/vendor/business-profile",
      icon: BriefcaseBusiness,
    },
    { label: "Settings", path: "/vendor/settings", icon: Settings },
    { label: "Support", path: "/vendor/support", icon: Headset },
  ],

  },
];

type VendorSidebarProps = {
  currentPath?: string;
};

export default function VendorSidebar({
  currentPath: providedPath,
}: VendorSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = providedPath ?? location.pathname;
  function handleLogout() {
    clearAuthSession();
    navigate("/vendor/login", { replace: true });
  }

  return (
    <aside className="dashboard-sidebar">
      <Link
        className="dashboard-brand"
        to="/vendor"
        aria-label="Pawdigree vendor home"
      >
        <img
          className="dashboard-brand-logo"
          src={lightModeLogo}
          alt="Pawdigree"
        />

        <img
          className="dashboard-brand-icon-logo"
          src={iconLogo}
          alt=""
          aria-hidden="true"
        />
      </Link>

      <nav className="dashboard-navigation" aria-label="Vendor navigation">
        {navigationGroups.map((group) => (
          <div className="dashboard-nav-group" key={group.title}>
            <p className="dashboard-nav-heading">{group.title}</p>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.path === "/vendor/listings" &&
                  currentPath.startsWith("/vendor/listings/")) ||
                (item.path === "/vendor/services/new" &&
                  currentPath.startsWith("/vendor/services/")) ||
                (item.path === "/vendor/orders" &&
                  (currentPath.startsWith("/vendor/orders/") ||
                    currentPath === "/vendor/bookings")) ||
                (item.path === "/vendor/customers" &&
                  currentPath === "/vendor/messages");

              const itemContent = (
                <>
                  <Icon
                    className="dashboard-nav-icon"
                    size={18}
                    strokeWidth={1.9}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight
                      className="dashboard-nav-chevron"
                      size={15}
                      aria-hidden="true"
                    />
                  )}
                </>
              );

              if (!implementedVendorPages.has(item.path)) {
                return (
                  <span
                    key={item.label}
                    className="dashboard-nav-item dashboard-nav-item-unavailable"
                    aria-disabled="true"
                    title={`${item.label} isn't available yet`}
                  >
                    {itemContent}
                  </span>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`dashboard-nav-item${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                >
                  {itemContent}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="dashboard-sidebar-footer">
        <div className="dashboard-sidebar-note">
          <Activity size={15} aria-hidden="true" />
          <span>Your business, one place.</span>
        </div>

        <button
          type="button"
          className="dashboard-logout"
          onClick={handleLogout}
        >
          <LogOut size={17} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

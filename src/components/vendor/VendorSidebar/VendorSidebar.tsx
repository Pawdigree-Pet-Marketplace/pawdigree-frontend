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
import { useVendorBusiness } from "../../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../../services/vendorBusinessRoutes";

const implementedVendorPages = new Set([
  "/vendor/dashboard",
  "/vendor/profile",
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
      {
  label: "Merchandise",
  path: "/vendor/merchandise",
  icon: ShoppingBag,
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
  const business = useVendorBusiness();
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
        {navigationGroups.map((group) => {
          const scopedItems = group.items.filter((item) => {
            if (!business) return true;
            if (item.path === "/vendor/listings" || item.path === "/vendor/adoption-applications") return business.business_type === "PET_SALE_ADOPTION";
            if (item.path === "/vendor/merchandise") return business.business_type === "PRODUCT_SELLER";
            if (item.path === "/vendor/services/new") return business.business_type === "SERVICE_PROVIDER";
            return true;
          });
          if (scopedItems.length === 0) return null;
          return (
          <div className="dashboard-nav-group" key={group.title}>
            <p className="dashboard-nav-heading">{group.title}</p>

            {scopedItems.map((item) => {
              const Icon = item.icon;
              const scopedPath = business
                ? item.path === "/vendor/dashboard"
                  ? vendorBusinessPath(String(business.id), "dashboard")
                  : item.path === "/vendor/profile"
                    ? vendorBusinessPath(String(business.id), "store-profile")
                    : item.path === "/vendor/listings"
                      ? vendorBusinessPath(String(business.id), "listings")
                      : item.path === "/vendor/adoption-applications"
                        ? vendorBusinessPath(String(business.id), "adoption-applications")
                        : item.path === "/vendor/services/new"
                          ? vendorBusinessPath(String(business.id), "services/new")
                          : item.path === "/vendor/merchandise"
                            ? vendorBusinessPath(String(business.id), "merchandise")
                            : item.path === "/vendor/business-profile"
                              ? vendorBusinessPath(String(business.id), "businesses")
                            : item.path
                : item.path;
              const isActive =
                currentPath === scopedPath ||
                (business && item.path === "/vendor/profile" && currentPath.endsWith("/store-profile")) ||
                (business && item.path === "/vendor/business-profile" && currentPath.endsWith("/businesses")) ||
                (item.path === "/vendor/listings" &&
                  (business ? currentPath.includes("/listings/") : currentPath.startsWith("/vendor/listings/"))) ||
                (item.path === "/vendor/services/new" &&
                  (business ? currentPath.includes("/services/") : currentPath.startsWith("/vendor/services/"))) ||
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

              if (!implementedVendorPages.has(item.path) && !(business && ["/vendor/dashboard", "/vendor/profile", "/vendor/listings", "/vendor/adoption-applications", "/vendor/services/new", "/vendor/merchandise"].includes(item.path))) {
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
                  to={scopedPath}
                  className={`dashboard-nav-item${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                >
                  {itemContent}
                </Link>
              );
            })}
          </div>
          );
        })}
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

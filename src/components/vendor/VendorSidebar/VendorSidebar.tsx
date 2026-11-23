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
  UserRound,
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
  "/vendor/store-profile",
  "/vendor/listings",
  "/vendor/merchandise",
  "/vendor/adoption-applications",
  "/vendor/services/new",
  "/vendor/services/catalog",
  "/vendor/business-profile",
  "/vendor/availability",
  "/vendor/orders",
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
      { label: "Catalog", path: "/vendor/listings", icon: Package },
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
        label: "Catalog",
        path: "/vendor/services/catalog",
        icon: Package,
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
    { label: "My Profile", path: "/vendor/profile", icon: UserRound },
    { label: "Store Profile", path: "/vendor/store-profile", icon: Store },
    {
      label: "My Businesses",
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
            if (!business) return item.path !== "/vendor/services/catalog";
            if (item.path === "/vendor/listings" || item.path === "/vendor/adoption-applications") return business.business_type === "PET_SALE_ADOPTION";
            if (item.path === "/vendor/merchandise") return business.business_type === "PRODUCT_SELLER";
            if (item.path === "/vendor/services/new" || item.path === "/vendor/services/catalog") return business.business_type === "SERVICE_PROVIDER";
            if (item.path === "/vendor/orders") return ["PRODUCT_SELLER", "SERVICE_PROVIDER"].includes(business.business_type ?? "");
            return true;
          });
          if (scopedItems.length === 0) return null;
          return (
          <div className="dashboard-nav-group" key={group.title}>
            <p className="dashboard-nav-heading">{group.title}</p>

            {scopedItems.map((item) => {
              const Icon = item.icon;
              const itemLabel = business?.business_type === "PRODUCT_SELLER" && item.path === "/vendor/merchandise"
                ? "Merchandise"
                : business?.business_type === "PET_SALE_ADOPTION" && item.path === "/vendor/listings"
                  ? "Catalog"
                  : business?.business_type === "PRODUCT_SELLER" && item.path === "/vendor/orders"
                    ? "Orders"
                    : business?.business_type === "SERVICE_PROVIDER" && item.path === "/vendor/orders"
                      ? "Bookings"
                      : item.label;
             
const scopedPath: string = (() => {
  if (!business) return item.path;

  switch (item.path) {
    case "/vendor/dashboard":
      return vendorBusinessPath(String(business.id), "dashboard");

    case "/vendor/profile":
      return vendorBusinessPath(String(business.id), "profile");

            case "/vendor/store-profile":
      return vendorBusinessPath(String(business.id), "store-profile");

    case "/vendor/listings":
      return vendorBusinessPath(String(business.id), "listings");

    case "/vendor/adoption-applications":
      return vendorBusinessPath(
        String(business.id),
        "adoption-applications"
      );

    case "/vendor/services/new":
      return vendorBusinessPath(String(business.id), "services/new");

    case "/vendor/services/catalog":
      return vendorBusinessPath(String(business.id), "services");

    case "/vendor/merchandise":
      return vendorBusinessPath(String(business.id), "merchandise");

    case "/vendor/orders":
      return vendorBusinessPath(String(business.id), "orders");

    case "/vendor/availability":
      return vendorBusinessPath(String(business.id), "availability");

    case "/vendor/business-profile":
      return vendorBusinessPath(String(business.id), "businesses");

    default:
      return item.path;
  }
})();

              const isActive =
                (currentPath === scopedPath && !(business?.business_type === "PET_SALE_ADOPTION" && item.path === "/vendor/listings" && location.search.includes("type=SALE"))) ||
            (item.path === "/vendor/store-profile" && (business ? currentPath.endsWith("/store-profile") : currentPath === "/vendor/store-profile")) ||
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
                  <span>{itemLabel}</span>
                  {isActive && (
                    <ChevronRight
                      className="dashboard-nav-chevron"
                      size={15}
                      aria-hidden="true"
                    />
                  )}
                </>
              );

        
              if (
                  !implementedVendorPages.has(item.path) &&
                !(
                  business &&
                  [
                    "/vendor/dashboard",
                    "/vendor/profile",
                    "/vendor/store-profile",
                    "/vendor/listings",
                    "/vendor/adoption-applications",
                    "/vendor/services/new",
                    "/vendor/services/catalog",
                    "/vendor/merchandise",
                    "/vendor/orders",
                    "/vendor/availability",
                  ].includes(item.path)
                )
              ) {
                return null;
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
            {business?.business_type === "PET_SALE_ADOPTION" && group.title === "YOUR STORE" && (
              <Link
                to={`${vendorBusinessPath(String(business.id), "listings")}?type=SALE`}
                className={`dashboard-nav-item${currentPath.endsWith("/listings") && location.search.includes("type=SALE") ? " active" : ""}`}
                aria-current={currentPath.endsWith("/listings") && location.search.includes("type=SALE") ? "page" : undefined}
                title="Pet Sales"
              >
                <ShoppingBag className="dashboard-nav-icon" size={18} strokeWidth={1.9} />
                <span>Pet Sales</span>
              </Link>
            )}
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

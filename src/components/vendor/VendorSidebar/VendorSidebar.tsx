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
  Wallet,
  Headset,
} from "lucide-react";
import "./VendorSidebar.css";
import lightModeLogo from "../../../assets/logos/lightmode-logo.svg";
import iconLogo from "../../../assets/logos/icon-logo.svg";

const navigationGroups = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/vendor/dashboard", icon: LayoutDashboard },
      { label: "Sales & Payouts", path: "/vendor/sales", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "MANAGE YOUR STORE",
    items: [
      { label: "Catalogue", path: "/vendor/listings", icon: Package },
      { label: "Orders & Bookings", path: "/vendor/orders", icon: ShoppingBag },
      { label: "Customers & Messages", path: "/vendor/customers", icon: MessageCircle },
      { label: "Availability", path: "/vendor/availability", icon: CalendarDays },
    ],
  },
  {
    title: "YOUR BUSINESS",
    items: [
      { label: "Store Profile", path: "/vendor/profile", icon: Store },
      { label: "Business & Payout", path: "/vendor/business", icon: Wallet },
      { label: "Settings", path: "/vendor/settings", icon: Settings },
      { label: "Support", path: "/vendor/support", icon: Headset },
    ],
  },
];

type VendorSidebarProps = {
  currentPath?: string;
};

export default function VendorSidebar({
  currentPath = window.location.pathname,
}: VendorSidebarProps) {
  function handleLogout() {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem("token");
      storage.removeItem("refresh");
      storage.removeItem("role");
    }

    window.location.href = "/vendor/login";
  }

  return (
    <aside className="dashboard-sidebar">
     <a
       className="dashboard-brand"
       href="/vendor"
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
     </a>

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
                (item.path === "/vendor/orders" &&
                  (currentPath.startsWith("/vendor/orders/") ||
                    currentPath === "/vendor/bookings")) ||
                (item.path === "/vendor/customers" &&
                  currentPath === "/vendor/messages");

              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`dashboard-nav-item${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                >
                  <Icon className="dashboard-nav-icon" size={18} strokeWidth={1.9} />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight
                      className="dashboard-nav-chevron"
                      size={15}
                      aria-hidden="true"
                    />
                  )}
                </a>
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

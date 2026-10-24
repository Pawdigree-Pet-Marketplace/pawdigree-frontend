import { useEffect, useState } from "react";
import {
  PawPrint,
  House,
  Compass,
  ShoppingBag,
  Stethoscope,
  HeartHandshake,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import logo from "../../../assets/logos/lightmode-logo.svg";
import API_BASE_URL from "../../../services/api";
import "./CustomerDashboardNav.css";
import { ConfirmLogout } from "../../layout/ConfirmLogout";

const navigationItems = [
  { label: "Overview", href: "/customer/dashboard", Icon: House },
  { label: "Discover", href: "#dashboard-listings", Icon: Compass },
  { label: "Browse Pets", href: "#dashboard-categories", Icon: PawPrint },
  { label: "Pet Store", href: "/#merchandise", Icon: ShoppingBag },
  { label: "Pet Services", href: "/#services", Icon: Stethoscope },
  { label: "Adoption", href: "/#adoption", Icon: HeartHandshake },
];

export default function CustomerDashboardNav() {
  const [activeItem, setActiveItem] = useState("Overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [storedName, setStoredName] = useState(
    localStorage.getItem("username") ||
      sessionStorage.getItem("username") ||
      "Pet Lover"
  );

  useEffect(() => {
    let cancelled = false;

    async function loadUsername() {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(API_BASE_URL + "/api/auth/profile/", {
          headers: { Authorization: "Bearer " + token },
        });
        if (!response.ok) return;

        const profile: { username?: string } = await response.json();
        const username = profile.username?.trim();
        if (!cancelled && username) {
          setStoredName(username);
          const storage = localStorage.getItem("token")
            ? localStorage
            : sessionStorage;
          storage.setItem("username", username);
        }
      } catch {
        // Keep the stored name or fallback if the profile request fails.
      }
    }

    void loadUsername();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const initial =
    storedName.replace(/^@/, "").trim().charAt(0).toUpperCase() || "P";

  const renderLinks = (mobile = false) => (
    <nav
      className={
        mobile ? "customer-dash-links customer-dash-links-mobile" : "customer-dash-links"
      }
      aria-label={mobile ? "Mobile customer navigation" : "Customer navigation"}
    >
      {navigationItems.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          onClick={() => {
            setActiveItem(label);
            if (mobile) setIsMobileMenuOpen(false);
          }}
          aria-current={activeItem === label ? "page" : undefined}
          className={"customer-dash-link" + (activeItem === label ? " is-active" : "")}
        >
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );

  const account = (
    <div className="customer-dash-account-area">
      <a
        className="customer-dash-account"
        href="/profile"
        aria-label={"Open " + storedName + "'s profile"}
      >
        <span className="customer-dash-avatar" aria-hidden="true">{initial}</span>
        <span className="customer-dash-account-copy">
          <span className="customer-dash-account-label">Signed in as</span>
          <span className="customer-dash-account-name">{storedName}</span>
        </span>
      </a>
      <button
        type="button"
        className="customer-dash-logout-option"
        onClick={() => {
          setIsMobileMenuOpen(false);
          setShowLogout(true);
        }}
      >
        <LogOut size={18} aria-hidden="true" />
        <span>Log out</span>
      </button>
    </div>
  );

  return (
    <>
      <aside className="customer-dash-sidebar" aria-label="Dashboard sidebar">
        <a
          className="customer-dash-brand"
          href="/customer/dashboard"
          aria-label="Pawdigree dashboard overview"
        >
          <img src={logo} alt="Pawdigree" className="customer-dash-logo" />
        </a>
        {renderLinks()}
        {account}
      </aside>

      <header className="customer-dash-mobile-header">
        <a href="/customer/dashboard" aria-label="Pawdigree dashboard overview">
          <img src={logo} alt="Pawdigree" className="customer-dash-logo" />
        </a>
        <button
          type="button"
          className="customer-dash-menu-toggle"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="customer-dash-side-drawer"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div
          className="customer-dash-drawer-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          role="presentation"
        >
          <aside
            id="customer-dash-side-drawer"
            className="customer-dash-side-drawer"
            aria-label="Customer navigation menu"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="customer-dash-drawer-heading">
              <img src={logo} alt="Pawdigree" className="customer-dash-drawer-logo" />
              <button
                type="button"
                className="customer-dash-drawer-close"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={22} />
              </button>
            </div>
            {renderLinks(true)}
            {account}
          </aside>
        </div>
      )}

      <ConfirmLogout
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </>
  );
}

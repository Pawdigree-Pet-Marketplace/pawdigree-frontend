import { useEffect, useState } from "react";
import {
  PawPrint,
  House,
  ShoppingBag,
  Stethoscope,
  HeartHandshake,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import logo from "../../../assets/logos/lightmode-logo.svg";
import { customerAuthenticatedFetch } from "../../../services/customerAuthenticatedFetch";
import {
  getSessionToken,
  getAuthStorage,
} from "../../../services/auth/authStorage";
import "./CustomerDashboardNav.css";
import { ConfirmLogout } from "../../layout/ConfirmLogout";
import { Link, useLocation } from "react-router-dom";

const navigationItems = [
  { label: "Overview", href: "/customer/dashboard", Icon: House },
  { label: "Browse Pets", href: "/explore-pets", Icon: PawPrint },
  { label: "Pet Catalogue", href: "/pets", Icon: ShoppingBag },
  { label: "Pet Store", Icon: ShoppingBag },
  { label: "Pet Services", href: "/vendors", Icon: Stethoscope },
  { label: "Adoption", href: "/customer/adoption", Icon: HeartHandshake },
];

export default function CustomerDashboardNav() {
  const { pathname, search } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [storedName, setStoredName] = useState(
    localStorage.getItem("username") ||
      sessionStorage.getItem("username") ||
      "Pet Lover",
  );

  const isAdoption = search.includes("listing_type=ADOPTION");

  const isItemActive = (label: string) => {
    switch (label) {
      case "Overview":
        return pathname === "/customer/dashboard";
      case "Browse Pets":
        return pathname === "/explore-pets" || pathname.startsWith("/pets/");
      case "Pet Catalogue":
        return pathname === "/pets" && !isAdoption;
      case "Pet Services":
        return pathname.startsWith("/vendors");
      case "Adoption":
        return pathname === "/pets" && isAdoption;
      default:
        return false;
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadUsername() {
      const token = getSessionToken();
      if (!token) return;

      try {
        const response = await customerAuthenticatedFetch("/api/auth/profile/");
        if (!response.ok) return;

        const profile: { username?: string } = await response.json();
        const username = profile.username?.trim();
        if (!cancelled && username) {
          setStoredName(username);
          getAuthStorage()?.setItem("username", username);
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
        mobile
          ? "customer-dash-links customer-dash-links-mobile"
          : "customer-dash-links"
      }
      aria-label={mobile ? "Mobile customer navigation" : "Customer navigation"}
    >
      {navigationItems.map(({ label, href, Icon }) => {
        const active = isItemActive(label);
        const className = [
          "customer-dash-link",
          active ? "is-active" : "",
          href ? "" : "is-unavailable",
        ]
          .filter(Boolean)
          .join(" ");
        const content = (
          <>
            <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{label}</span>
          </>
        );

        return href ? (
          <Link
            key={label}
            to={href}
            onClick={() => {
              if (mobile) setIsMobileMenuOpen(false);
            }}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            {content}
          </Link>
        ) : (
          <span key={label} className={className} aria-disabled="true">
            {content}
          </span>
        );
      })}
    </nav>
  );

  const account = (
    <div className="customer-dash-account-area">
      <Link
        className="customer-dash-account"
        to="/profile"
        aria-label={"Open " + storedName + "'s profile"}
      >
        <span className="customer-dash-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="customer-dash-account-copy">
          <span className="customer-dash-account-label">Signed in as</span>
          <span className="customer-dash-account-name">{storedName}</span>
        </span>
      </Link>
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
        <Link
          className="customer-dash-brand"
          to="/customer/dashboard"
          aria-label="Pawdigree dashboard overview"
        >
          <img src={logo} alt="Pawdigree" className="customer-dash-logo" />
        </Link>
        {renderLinks()}
        {account}
      </aside>

      <header className="customer-dash-mobile-header">
        <Link
          to="/customer/dashboard"
          aria-label="Pawdigree dashboard overview"
        >
          <img src={logo} alt="Pawdigree" className="customer-dash-logo" />
        </Link>
        <button
          type="button"
          className="customer-dash-menu-toggle"
          aria-label={
            isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
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
              <img
                src={logo}
                alt="Pawdigree"
                className="customer-dash-drawer-logo"
              />
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

      <ConfirmLogout isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}

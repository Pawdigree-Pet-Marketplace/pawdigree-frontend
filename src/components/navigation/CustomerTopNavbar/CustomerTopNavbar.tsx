import darkLogo from "../../../assets/logos/darkmode-logo.svg";
import lightLogo from "../../../assets/logos/lightmode-logo.svg";
import {
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../../Button/Button";
import "./CustomerTopNavbar.css";

type TopNavbarProps = {
  isLoggedIn: boolean;
  audience?: "customer" | "vendor";
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const navLinks = [
  { label: "Browse Pets", href: "#pets" },
  { label: "Services", href: "#services" },
  { label: "Merchandise", href: "#merchandise" },
  { label: "Become a Vendor", href: "/vendor" },
  { label: "Help Center", href: "#" },
];

const TopNavbar = ({
  isLoggedIn,
  audience = "customer",
  isMenuOpen,
  setIsMenuOpen,
}: TopNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hash, setHash] = useState(window.location.hash);
  const path = window.location.pathname;
  const isLandingPage = path === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href.startsWith("#")) return isLandingPage && hash === href;
    return path === href || path.startsWith(`${href}/`);
  };

  // Dark logo only while the navbar is transparent over the hero
  const useDarkLogo = isLandingPage && !isScrolled;

  const navbarClass = [
    "top-navbar",
    isLandingPage ? "top-navbar--transparent" : "",
    isLandingPage && isScrolled ? "top-navbar--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={navbarClass}>
      <a href="/" aria-label="Pawdigree home">
        <img
          src={useDarkLogo ? darkLogo : lightLogo}
          alt="Pawdigree"
          className={`logo-img ${useDarkLogo ? "logo-img--dark" : ""}`}
        />
      </a>

      <nav className="desktop-links">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={isActive(link.href) ? "is-active" : undefined}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="desktop-actions">
        {!isLoggedIn ? (
          <>
            <Button
              className="auth-btn"
              variant="primary"
              onClick={() => {
                window.location.href = audience === "vendor" ? "/vendor/login" : "/customer-login";
              }}
            >
              Log In
            </Button>
            <Button
              className="auth-btn"
              variant="secondary"
              onClick={() => {
                window.location.href = audience === "vendor" ? "/vendor/register" : "/registration";
              }}
            >
              Sign Up
            </Button>
          </>
        ) : (
          <Button
            className="auth-btn dashboard-redirect-btn"
            variant="secondary"
            onClick={() => {
              window.location.href =
                audience === "vendor" ? "/vendor/dashboard" : "/customer/dashboard";
            }}
          >
            {audience === "vendor" ? "Vendor Dashboard" : "Go to Dashboard"}
          </Button>
        )}

        <button
          className="hamburger"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;

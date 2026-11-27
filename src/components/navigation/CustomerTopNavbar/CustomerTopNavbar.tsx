import lightLogo from "../../../assets/logos/lightmode-logo.svg";
import darkLogo from "../../../assets/logos/darkmode-logo.svg";
import { Menu, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import Button from "../../Button/Button";
import "./CustomerTopNavbar.css";

type TopNavbarProps = {
  isLoggedIn: boolean;
  audience?: "customer" | "vendor";
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const navLinks = [
  { label: "Browse Pets", href: "/explore-pets" },
  { label: "Services", href: "/services" },
  { label: "Merchandise", href: "/merchandise" },
  { label: "Become a Vendor", href: "/vendor" },
  { label: "Help Center", href: "#" },
];

const TopNavbar = ({
  isLoggedIn,
  audience = "customer",
  isMenuOpen,
  setIsMenuOpen,
}: TopNavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const hash = location.hash;
  const path = location.pathname;
  const isLandingPage = path === "/";
  const isVendorLandingPage = path === "/vendor";
  const isLightBackgroundPage = !isLandingPage && !isVendorLandingPage;

  const useDarkLogo = isLandingPage && !isScrolled;
  const useMobileLightLogo = isVendorLandingPage && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href.startsWith("#")) return isLandingPage && hash === href;
    return path === href || path.startsWith(`${href}/`);
  };

  const navbarClass = [
    "top-navbar",
    "top-navbar--transparent",
    isLightBackgroundPage ? "top-navbar--light-background" : "",
    isScrolled ? "top-navbar--scrolled" : "",
    isLandingPage && !isScrolled ? "top-navbar--glow" : "",
    isVendorLandingPage && !isScrolled ? "top-navbar--band" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={navbarClass}>
      <div className="top-navbar-brand">
        <Link to="/" aria-label="Pawdigree home">
          <picture>
            {useMobileLightLogo && (
              <source media="(max-width: 900px)" srcSet={darkLogo} />
            )}
            <img
              src={useDarkLogo ? darkLogo : lightLogo}
              alt="Pawdigree"
              className="logo-img"
            />
          </picture>
        </Link>
      </div>

      <nav className="desktop-links">
        {navLinks.map((link) => {
          const label =
            audience === "vendor" && link.label === "Become a Vendor"
              ? "Vendor Home"
              : link.label;
          const href =
            link.href.startsWith("#") && !isLandingPage
              ? `/${link.href}`
              : link.href;
          return (
            <Link
              key={label}
              to={href}
              className={isActive(link.href) ? "is-active" : undefined}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="desktop-actions">
        {!isLoggedIn ? (
          <>
            <Button
              className="auth-btn"
              variant="primary"
              onClick={() => {
                navigate(
                  audience === "vendor" ? "/vendor/login" : "/customer-login",
                  audience === "customer" && path === "/customer/cart"
                    ? { state: { from: location } }
                    : undefined,
                );
              }}
            >
              Log In
            </Button>
            <Button
              className="auth-btn"
              variant="secondary"
              onClick={() => {
                navigate(
                  audience === "vendor" ? "/vendor/register" : "/registration",
                  audience === "customer" && path === "/customer/cart"
                    ? { state: { from: location } }
                    : undefined,
                );
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
              navigate(
                audience === "vendor"
                  ? "/vendor/dashboard"
                  : "/customer/dashboard",
              );
            }}
          >
            {audience === "vendor" ? "Vendor Dashboard" : "Go to Dashboard"}
          </Button>
        )}

        {audience === "customer" && (
          <Link
            to="/customer/cart"
            className="cart-nav-link"
            aria-label={`Shopping cart${cartCount ? `, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : ""}`}
            aria-current={path === "/customer/cart" ? "page" : undefined}
            title="Shopping cart"
          >
            <ShoppingCart size={21} aria-hidden="true" />
            {cartCount > 0 && (
              <span className="cart-nav-badge" aria-hidden="true">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        )}

        {audience === "customer" && (
          <button
            type="button"
            className="hamburger"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;

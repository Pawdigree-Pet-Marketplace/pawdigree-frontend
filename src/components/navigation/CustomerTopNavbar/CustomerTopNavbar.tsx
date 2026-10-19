import logo from "../../../assets/logos/lightmode-logo.svg";
import {
  Heart,
  ShoppingCart,
  Bell,
  MessageCircle,
  UserRound,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../../Button/Button";
import "./CustomerTopNavbar.css";

type TopNavbarProps = {
  isLoggedIn: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const TopNavbar = ({
  isLoggedIn,
  isMenuOpen,
  setIsMenuOpen,
}: TopNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const isLandingPage = window.location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navbarClass = [
    "top-navbar",
    isLandingPage ? "top-navbar--transparent" : "",
    isLandingPage && isScrolled ? "top-navbar--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={navbarClass}>
      <img src={logo} alt="Pawdigree" className="logo-img" />

      <nav className="desktop-links">
        <a href="#pets">Browse Pets</a>
        <a href="#services">Services</a>
        <a href="#merchandise">Merchandise</a>
        <a href="/vendor">Become a Vendor</a>
        <a href="#">Help Center</a>
      </nav>

      <div className="desktop-actions">
        {!isLoggedIn ? (
          <>
            <Button
              className="auth-btn"
              variant="primary"
              onClick={() => {
                window.location.href = "/customer-login";
              }}
            >
              Log In
            </Button>
            <Button
              className="auth-btn"
              variant="secondary"
              onClick={() => {
                window.location.href = "/registration";
              }}
            >
              Sign Up
            </Button>
          </>
        ) : (
          <div className="topnav-icons">
            <Heart size={22} strokeWidth={1.6} />
            <ShoppingCart size={22} strokeWidth={1.6} />
            <Bell size={22} strokeWidth={1.6} />
            <MessageCircle size={22} strokeWidth={1.6} />
            <UserRound size={22} strokeWidth={1.6} />
          </div>
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

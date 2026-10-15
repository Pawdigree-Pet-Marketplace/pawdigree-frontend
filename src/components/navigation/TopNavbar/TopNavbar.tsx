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
import Button from "../../Button/Button";
import "./TopNavbar.css";

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
  return (
    <header className="top-navbar">
      <img src={logo} alt="Pawdigree" className="logo-img" />
      <nav className="desktop-links">
        <a href="#pets">Browse Pets</a>
        <a href="#services">Services</a>
        <a href="#merchandise">Merchandise</a>
        <a href="/vendor">Become a Seller</a>
        <a href="#">Help Center</a>
      </nav>
      <div className="desktop-actions">
        {!isLoggedIn ? (
          <>
            <Button
              variant="primary"
              onClick={() => {
                window.location.href = "/customer-login";
              }}
            >
              Log In
            </Button>
            <Button
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
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
};
export default TopNavbar;

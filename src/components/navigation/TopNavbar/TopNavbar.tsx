import logo from "../../../assets/logos/lightmode-logo.png";
import { Heart, ShoppingBag, Bell, MessageCircle, Menu, X } from "lucide-react";
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
        <a href="#">Become a Seller</a>
        <a href="#">Help Center</a>
      </nav>
      <div className="desktop-actions">
        {!isLoggedIn ? (
          <>
            <Button variant="primary">Log In</Button>
            <Button
                 variant="secondary"
                 onClick={() => {
                 window.location.href = '/registration'
  }}
>
  Sign Up
</Button>
          </>
        ) : (
          <div className="topnav-icons">
            <Heart size={20} strokeWidth={1.8} />
            <ShoppingBag size={20} strokeWidth={1.8} />
            <Bell size={20} strokeWidth={1.8} />
            <MessageCircle size={20} strokeWidth={1.8} />
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

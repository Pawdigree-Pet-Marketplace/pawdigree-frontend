import logo from "../../../assets/logos/lightmode-logo.svg";
import { X, HelpCircle } from "lucide-react";
import "./CustomerSidemenu.css";

type SideMenuProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  onClose: () => void;
};

const SideMenu = ({ isOpen, isLoggedIn, onClose }: SideMenuProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="sidemenu-overlay" onClick={onClose} />
      <aside className="side-menu">
        <div className="sidemenu-header">
          <img
            src={logo}
            style={{ width: "160px" }}
            alt="Pawdigree"
            className="sidemenu-logo-img"
          />
          <button className="close-btn" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <div className="sidemenu-content">
          <a href="#pets" className="sidemenu-item" onClick={onClose}>
            Browse Pets
          </a>
          <a href="#services" className="sidemenu-item" onClick={onClose}>
            Services
          </a>
          <a href="#merchandise" className="sidemenu-item" onClick={onClose}>
            Merchandise
          </a>
          <a href="/vendor" className="sidemenu-item" onClick={onClose}>
            Become a Seller
          </a>
          <div className="sidemenu-divider" />
          <a href="#help" className="sidemenu-item" onClick={onClose}>
            <HelpCircle size={18} /> Help Center
          </a>

          {isLoggedIn ? (
            <a
              href="/customer/dashboard"
              className="sidemenu-item"
              onClick={onClose}
            >
              Customer Dashboard
            </a>
          ) : (
            <div className="sidemenu-auth">
              <button
                className="login-btn-full"
                onClick={() => {
                  onClose();
                  window.location.href = "/customer-login";
                }}
              >
                Log In
              </button>
              <button
                className="signup-btn-full"
                onClick={() => {
                  onClose();
                  window.location.href = "/registration";
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default SideMenu;

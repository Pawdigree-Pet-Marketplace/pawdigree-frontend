import { useState } from "react";
import logo from "../../../assets/logos/lightmode-logo.svg";
import {
  X,
  UserRound,
  MessageCircle,
  Bell,
  Heart,
  ShoppingBag,
  HelpCircle,
  LogOut,
  Store,
  Package,
} from "lucide-react";
import { ConfirmLogout } from "../../layout/ConfirmLogout";
import "./CustomerSidemenu.css";

type SideMenuProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  onClose: () => void;
};

const SideMenu = ({ isOpen, isLoggedIn, onClose }: SideMenuProps) => {
  const [showLogout, setShowLogout] = useState(false);

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
          <button className="close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="sidemenu-content">
          {!isLoggedIn ? (
            <>
              <a href="#" className="sidemenu-item">
                Browse Pets
              </a>
              <a href="#" className="sidemenu-item">
                Services
              </a>
              <a href="#" className="sidemenu-item">
                Merchandise
              </a>
              <a href="/vendor/register" className="sidemenu-item">
                Become a Seller
              </a>
              <div className="sidemenu-divider" />
              <a href="#" className="sidemenu-item">
                <HelpCircle size={18} /> Help Center
              </a>
              <div className="sidemenu-auth">
                <button className="login-btn-full">Log In</button>
                <button
                  className="signup-btn-full"
                  onClick={() => {
                    window.location.href = "/registration";
                  }}
                >
                  Sign Up
                </button>
              </div>
            </>
          ) : (
            <>
              <a href="#" className="sidemenu-item">
                <UserRound size={18} /> Profile
              </a>
              <a href="#" className="sidemenu-item">
                <MessageCircle size={18} /> Messages
              </a>
              <a href="#" className="sidemenu-item">
                <Bell size={18} /> Notifications
              </a>
              <a href="#" className="sidemenu-item">
                <Heart size={18} /> Favorites
              </a>
              <a href="#" className="sidemenu-item">
                <ShoppingBag size={18} /> Cart
              </a>
              <a href="#" className="sidemenu-item">
                <Package size={18} /> My Orders
              </a>
              <a href="#" className="sidemenu-item">
                <Store size={18} /> Seller Dashboard
              </a>
              <div className="sidemenu-divider" />
              <a href="#" className="sidemenu-item">
                <HelpCircle size={18} /> Help Center
              </a>
              <button
                className="sidemenu-item logout"
                onClick={() => setShowLogout(true)}
              >
                <LogOut size={18} /> Log Out
              </button>
            </>
          )}
        </div>

        <ConfirmLogout
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      </aside>
    </>
  );
};

export default SideMenu;

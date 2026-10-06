import logo from "../../../assets/logo.png";
import {
  X,
  User,
  MessageCircle,
  Bell,
  Heart,
  ShoppingBag,
  HelpCircle,
  LogOut,
  Store,
  Package,
} from "lucide-react";
import "./Sidemenu.css";

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
      {/* Charcoal overlay */}
      <div className="sidemenu-overlay" onClick={onClose} />

      {/* Drawer - 82% width */}
      <aside className="side-menu">
        <div className="sidemenu-header">
          <img src={logo} alt="Pawdigree" className="sidemenu-logo-img" />
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
              <a href="#" className="sidemenu-item">
                Become a Seller
              </a>
              <div className="sidemenu-divider" />
              <a href="#" className="sidemenu-item">
                <HelpCircle size={18} /> Help Center
              </a>
              <div className="sidemenu-auth">
                <button className="login-btn-full">Log In</button>
                <button className="signup-btn-full">Sign Up</button>
              </div>
            </>
          ) : (
            <>
              <a href="#" className="sidemenu-item">
                <User size={18} /> Profile
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
              <a href="#" className="sidemenu-item logout">
                <LogOut size={18} /> Log Out
              </a>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default SideMenu;

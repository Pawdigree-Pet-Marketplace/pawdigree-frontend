import logo from "../../../assets/logos/lightmode-logo.svg";
import { X, HelpCircle } from "lucide-react";
import "./CustomerSidemenu.css";

type SideMenuProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  audience?: "customer" | "vendor";
  onClose: () => void;
};

const SideMenu = ({ isOpen, isLoggedIn, audience = "customer", onClose }: SideMenuProps) => {
  if (!isOpen) return null;
  const customer = audience === "customer";
  const homeHash = (hash: string) => `/${hash}`;

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
          <a href={homeHash("#pets")} className="sidemenu-item" onClick={onClose}>
            Browse Pets
          </a>
          <a href={homeHash("#services")} className="sidemenu-item" onClick={onClose}>
            Services
          </a>
          <a href={homeHash("#merchandise")} className="sidemenu-item" onClick={onClose}>
            Merchandise
          </a>
          <a href="/vendor" className="sidemenu-item" onClick={onClose}>
            {customer ? "Become a Seller" : "Vendor Home"}
          </a>
          <div className="sidemenu-divider" />
          <a href={homeHash("#help")} className="sidemenu-item" onClick={onClose}>
            <HelpCircle size={18} /> Help Center
          </a>

          {isLoggedIn ? (
            <a
              href={audience === "vendor" ? "/vendor/dashboard" : "/customer/dashboard"}
              className="sidemenu-item"
              onClick={onClose}
            >
              {audience === "vendor" ? "Vendor Dashboard" : "Customer Dashboard"}
            </a>
          ) : (
            <div className="sidemenu-auth">
              <button
                className="login-btn-full"
                onClick={() => {
                  onClose();
                  window.location.href = audience === "vendor" ? "/vendor/login" : "/customer-login";
                }}
              >
                Log In
              </button>
              <button
                className="signup-btn-full"
                onClick={() => {
                  onClose();
                  window.location.href = audience === "vendor" ? "/vendor/register" : "/registration";
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

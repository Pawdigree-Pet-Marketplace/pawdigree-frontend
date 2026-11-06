import logo from "../../../assets/logos/lightmode-logo.svg";
import { X, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./CustomerSidemenu.css";

type SideMenuProps = {
  isOpen: boolean;
  isLoggedIn: boolean;
  audience?: "customer" | "vendor";
  onClose: () => void;
};

const SideMenu = ({
  isOpen,
  isLoggedIn,
  audience = "customer",
  onClose,
}: SideMenuProps) => {
  const navigate = useNavigate();
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
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="sidemenu-content">
          <Link to="/explore-pets" className="sidemenu-item" onClick={onClose}>
            Browse Pets
          </Link>
          <Link
            to={homeHash("#services")}
            className="sidemenu-item"
            onClick={onClose}
          >
            Services
          </Link>
          <Link
            to={homeHash("#merchandise")}
            className="sidemenu-item"
            onClick={onClose}
          >
            Merchandise
          </Link>
          <Link to="/vendor" className="sidemenu-item" onClick={onClose}>
            {customer ? "Become a Seller" : "Vendor Home"}
          </Link>
          <div className="sidemenu-divider" />
          <Link
            to={homeHash("#help")}
            className="sidemenu-item"
            onClick={onClose}
          >
            <HelpCircle size={18} /> Help Center
          </Link>

          {isLoggedIn ? (
            <Link
              to={
                audience === "vendor"
                  ? "/vendor/dashboard"
                  : "/customer/dashboard"
              }
              className="sidemenu-item"
              onClick={onClose}
            >
              {audience === "vendor"
                ? "Vendor Dashboard"
                : "Customer Dashboard"}
            </Link>
          ) : (
            <div className="sidemenu-auth">
              <button
                type="button"
                className="login-btn-full"
                onClick={() => {
                  onClose();
                  navigate(
                    audience === "vendor" ? "/vendor/login" : "/customer-login",
                  );
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className="signup-btn-full"
                onClick={() => {
                  onClose();
                  navigate(
                    audience === "vendor"
                      ? "/vendor/register"
                      : "/registration",
                  );
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

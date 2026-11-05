import { Home, ShoppingBag, MessageSquare, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useSession from "../../../hooks/useSession";
import "./CustomerBottomNavbar.css";

const navItems = [
  { label: "Home", icon: Home },
  { label: "Cart", icon: ShoppingBag },
  { label: "Chat", icon: MessageSquare },
  { label: "Profile", icon: User },
];

const BottomNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = useSession("CUSTOMER");
  const handleNavigation = (label: string) => {
    switch (label) {
      case "Home":
        navigate(isLoggedIn ? "/customer/dashboard" : "/");
        break;

      case "Profile":
        navigate(isLoggedIn ? "/profile" : "/customer-login");
        break;

      default:
        break;
    }
  };

  return (
    <nav className="bottom-navbar">
      <div className="bottom-pill">
        {navItems.map(({ label, icon: Icon }) => {
          const isActive =
            (label === "Home" &&
              (location.pathname === "/" ||
                location.pathname === "/customer/dashboard")) ||
            (label === "Cart" && location.pathname === "/cart") ||
            (label === "Chat" && location.pathname === "/chat") ||
            (label === "Profile" &&
              (location.pathname === "/profile" ||
                location.pathname.startsWith("/profile/")));
          return (
            <button
              onClick={() => handleNavigation(label)}
              key={label}
              className={`nav-item${isActive ? " active" : ""}`}
            >
              <span
                className={`icon-circle${isActive ? " active-circle" : ""}`}
              >
                <Icon size={20} />
              </span>
              <span className="nav-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
export default BottomNavbar;

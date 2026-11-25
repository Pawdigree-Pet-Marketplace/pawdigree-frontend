import { Home, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useSession from "../../../hooks/useSession";
import "./CustomerBottomNavbar.css";

const navItems = [
  { label: "Home", icon: Home },
  { label: "Cart", icon: ShoppingBag },
  { label: "Requests", icon: ClipboardList },
  { label: "Sign in", icon: User },
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

      case "Sign in":
        navigate(isLoggedIn ? "/profile" : "/customer-login");
        break;

      case "Requests":
        navigate(isLoggedIn ? "/customer/adoption?view=requests" : "/customer-login");
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
            (label === "Requests" && location.pathname === "/customer/adoption" && location.search.includes("view=requests")) ||
            (label === "Sign in" &&
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

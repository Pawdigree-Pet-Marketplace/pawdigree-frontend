import { Home, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useSession from "../../../hooks/useSession";
import { useCart } from "../../../context/CartContext";
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
  const { cartCount } = useCart();
  const handleNavigation = (label: string) => {
    switch (label) {
      case "Home":
        navigate(isLoggedIn ? "/customer/dashboard" : "/");
        break;

      case "Sign in":
        navigate(
          isLoggedIn ? "/profile" : "/customer-login",
          !isLoggedIn && location.pathname === "/customer/cart"
            ? { state: { from: location } }
            : undefined,
        );
        break;

      case "Requests":
        navigate(
          isLoggedIn ? "/customer/adoption?view=requests" : "/customer-login",
          undefined,
        );
        break;

      case "Cart":
        navigate("/customer/cart");
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
            (label === "Cart" && location.pathname === "/customer/cart") ||
            (label === "Requests" && location.pathname === "/customer/adoption" && location.search.includes("view=requests")) ||
            (label === "Sign in" &&
              (location.pathname === "/profile" ||
                location.pathname.startsWith("/profile/")));
          return (
            <button
              type="button"
              onClick={() => handleNavigation(label)}
              key={label}
              className={`nav-item${isActive ? " active" : ""}`}
              aria-label={label === "Cart" ? `Cart${cartCount ? `, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : ""}` : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`icon-circle${isActive ? " active-circle" : ""}`}
              >
                <Icon size={20} />
                {label === "Cart" && cartCount > 0 && (
                  <span className="nav-cart-badge" aria-hidden="true">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
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

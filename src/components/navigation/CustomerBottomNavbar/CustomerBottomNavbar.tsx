import { Home, ShoppingBag, MessageSquare, User } from "lucide-react";
import "./CustomerBottomNavbar.css";

const navItems = [
  { label: "Home", icon: Home },
  { label: "Cart", icon: ShoppingBag },
  { label: "Chat", icon: MessageSquare },
  { label: "Profile", icon: User },
];

// TODO: replace this with your actual active route (e.g. from useLocation())
const activeLabel = "Home";

const BottomNavbar = () => {
  return (
    <nav className="bottom-navbar">
      <div className="bottom-pill">
        {navItems.map(({ label, icon: Icon }) => {
          const isActive = label === activeLabel;
          return (
            <button
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

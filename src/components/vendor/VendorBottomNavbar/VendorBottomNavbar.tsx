import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarCheck,
  Home,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Package,
  Sparkles,
  User,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import "./VendorBottomNavbar.css";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string; // "#id" = in-page anchor, "/path" = page
};

// Before login: the landing page sections + login
const guestItems: NavItem[] = [
  { label: "Home", icon: Home, href: "#home" },
  { label: "Benefits", icon: Sparkles, href: "#benefits" },
  { label: "How it works", icon: ListChecks, href: "#how-it-works" },
  { label: "Log in", icon: LogIn, href: "/vendor/login" },
];

// After login as a vendor (adjust the paths to your real routes)
const vendorItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/vendor/dashboard" },
  { label: "Listings", icon: Package, href: "/vendor/listings" },
  { label: "Orders", icon: CalendarCheck, href: "/vendor/orders" },
  { label: "Chat", icon: MessageSquare, href: "/vendor/messages" },
  { label: "Profile", icon: User, href: "/vendor/profile" },
];

type VendorLandingBottomNavbarProps = {
  isLoggedIn: boolean;
};

const VendorBottomNavbar = ({ isLoggedIn }: VendorLandingBottomNavbarProps) => {
  const location = useLocation();
  const [activeAnchor, setActiveAnchor] = useState("#home");
  const items = isLoggedIn ? vendorItems : guestItems;

  // Highlight the guest tab for the section currently on screen
  useEffect(() => {
    if (isLoggedIn) return;

    const sections = ["benefits", "how-it-works"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveAnchor(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    const onScroll = () => {
      if (window.scrollY < 200) setActiveAnchor("#home");
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [isLoggedIn]);

  const isActive = (href: string) =>
    href.startsWith("#")
      ? href === activeAnchor
      : location.pathname.startsWith(href);

  return (
    <nav className="vendor-bottom-navbar" aria-label="Mobile navigation">
      <div className="vendor-bottom-pill">
        {items.map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              to={href}
              className={`vendor-nav-item${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`vendor-icon-circle${
                  active ? " vendor-active-circle" : ""
                }`}
              >
                <Icon size={20} />
              </span>
              <span className="vendor-nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default VendorBottomNavbar;

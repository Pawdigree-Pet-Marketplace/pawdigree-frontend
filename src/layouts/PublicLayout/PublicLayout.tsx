import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";
import useSession from "../../hooks/useSession";

export default function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  const audience =
    pathname === "/vendor" || pathname.startsWith("/vendor/")
      ? "vendor"
      : "customer";
  const isLoggedIn = useSession(audience === "vendor" ? "VENDOR" : "CUSTOMER");

  useEffect(() => setIsMenuOpen(false), [pathname, hash]);

  useEffect(() => {
    if (hash) {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <>
      <TopNavbar
        isLoggedIn={isLoggedIn}
        audience={audience}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <SideMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setIsMenuOpen(false)}
      />

      <Outlet />

      <Footer />
      <BottomNavbar />
    </>
  );
}

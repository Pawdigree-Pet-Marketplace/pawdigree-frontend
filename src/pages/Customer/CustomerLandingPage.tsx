import { useEffect, useState } from "react";
import Adoption from "../../components/home/Adoption";
import Footer from "../../components/layout/Footer";
import Categories from "../../components/home/Categories";
import CtaBanner from "../../components/home/CtaBanner";
import Hero from "../../components/home/Hero";
import HowItWorks from "../../components/home/HowItWorks";
import Listings from "../../components/home/Listings";
import Merchandise from "../../components/home/Merchandise";
import Services from "../../components/home/Services";
import Stats from "../../components/home/Stats";
import Testimonials from "../../components/home/Testimonials";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";

function hasCustomerSession() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");
  return Boolean(token && role === "CUSTOMER");
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCustomerSignedIn, setIsCustomerSignedIn] = useState(hasCustomerSession);

  useEffect(() => {
    const checkCustomerSession = () => {
      setIsCustomerSignedIn(hasCustomerSession());
    };

    checkCustomerSession();
    window.addEventListener("storage", checkCustomerSession);
    window.addEventListener("focus", checkCustomerSession);

    return () => {
      window.removeEventListener("storage", checkCustomerSession);
      window.removeEventListener("focus", checkCustomerSession);
    };
  }, []);

  useEffect(() => {
    if (isCustomerSignedIn) {
      window.location.replace("/customer/dashboard");
    }
  }, [isCustomerSignedIn]);

  if (isCustomerSignedIn) return null;

  return (
    <>
      <TopNavbar
        isLoggedIn={false}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <SideMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        isLoggedIn={false}
        onClose={() => setIsMenuOpen(false)}
      />
      <main>
        <Hero />
        <Stats />
        <Categories />
        <Merchandise />
        <HowItWorks />
        <Listings />
        <Adoption />
        <Services />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
      <BottomNavbar />
    </>
  );
}

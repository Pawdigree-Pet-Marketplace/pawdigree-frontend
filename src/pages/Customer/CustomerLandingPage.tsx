import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import "./CustomerLandingPage.css";

function hasCustomerSession() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");
  return Boolean(token && role === "CUSTOMER");
}

export default function LandingPage() {
  const navigate = useNavigate();
  const landingRef = useRef<HTMLElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCustomerSignedIn, setIsCustomerSignedIn] = useState(hasCustomerSession);

  useEffect(() => {
    const landing = landingRef.current;
    if (!landing || typeof IntersectionObserver === "undefined") return;

    const headings = Array.from(landing.querySelectorAll("section:not(.hero)"))
      .map((section) => section.querySelector(".section-title, h2"))
      .filter((heading): heading is Element => heading !== null);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    landing.classList.add("landing-motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 },
    );

    headings.forEach((heading) => {
      heading.classList.add("landing-section-reveal");
      observer.observe(heading);
    });

    return () => observer.disconnect();
  }, []);

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
      navigate("/customer/dashboard", { replace: true });
    }
  }, [isCustomerSignedIn, navigate]);

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
      <main ref={landingRef} className="landing-page">
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

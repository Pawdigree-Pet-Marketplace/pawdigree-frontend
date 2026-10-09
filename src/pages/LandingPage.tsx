import { useState, useEffect } from "react";
import Adoption from "../components/home/Adoption";
import Footer from "../components/layout/Footer";
import Categories from "../components/home/Categories";
import CtaBanner from "../components/home/CtaBanner";
import Hero from "../components/home/Hero";
import HowItWorks from "../components/home/HowItWorks";
import Listings from "../components/home/Listings";
import Merchandise from "../components/home/Merchandise";
import Services from "../components/home/Services";
import Stats from "../components/home/Stats";
import Testimonials from "../components/home/Testimonials";

import TopNavbar from "../components/navigation/TopNavbar/TopNavbar";
import SideMenu from "../components/navigation/SideMenu/SideMenu";
import BottomNavbar from "../components/navigation/BottomNavbar/BottomNavbar";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // This makes it switch between Logged In / Logged Out
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <>
      <TopNavbar
        isLoggedIn={isLoggedIn}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <SideMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        isLoggedIn={isLoggedIn}
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

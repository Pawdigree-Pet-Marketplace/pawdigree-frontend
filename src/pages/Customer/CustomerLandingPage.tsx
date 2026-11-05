import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Adoption from "../../components/home/Adoption";
import Categories from "../../components/home/Categories";
import CtaBanner from "../../components/home/CtaBanner";
import Hero from "../../components/home/Hero";
import HowItWorks from "../../components/home/HowItWorks";
import Listings from "../../components/home/Listings";
import Merchandise from "../../components/home/Merchandise";
import Services from "../../components/home/Services";
import Stats from "../../components/home/Stats";
import Testimonials from "../../components/home/Testimonials";
import useSession from "../../hooks/useSession";
import "./CustomerLandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const landingRef = useRef<HTMLElement | null>(null);
  const isCustomerSignedIn = useSession("CUSTOMER");

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
    if (isCustomerSignedIn) {
      navigate("/customer/dashboard", { replace: true });
    }
  }, [isCustomerSignedIn, navigate]);

  if (isCustomerSignedIn) return null;

  return (
    <main ref={landingRef} className="landing-page">
      <Hero />
      <Stats />
      <Categories
        getHref={({ name }) => {
          const speciesByCategory: Record<string, string> = {
            Dogs: "dog",
            Cats: "cat",
            Birds: "bird",
            Rabbits: "rabbit",
            Aquatic: "fish",
          };
          const species = speciesByCategory[name];
          return species
            ? `/explore-pets?species=${species}`
            : "/explore-pets";
        }}
      />
      <Merchandise />
      <HowItWorks />
      <Listings />
      <Adoption />
      <Services />
      <Testimonials />
      <CtaBanner />
    </main>
  );
}

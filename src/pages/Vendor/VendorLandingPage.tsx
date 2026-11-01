import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./VendorLandingPage.css";
import vendorHero from "../../assets/images/vendor-hero.jpg";
import { Link } from "react-router-dom";

import {
  ArrowUpRight,
  CalendarCheck,
  ChartNoAxesCombined,
  CheckCircle2,
  LayoutDashboard,
  Package,
  PawPrint,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  UsersRound,
} from "lucide-react";

const benefits = [
  {
    icon: UsersRound,
    title: "Reach more customers",
    description:
      "Connect your business with pet owners and pet seekers on Pawdigree.",
  },
  {
    icon: Package,
    title: "Showcase your products",
    description: "List and manage your pet products in one place.",
  },
  {
    icon: Stethoscope,
    title: "Offer pet services",
    description: "Promote your services and manage customer bookings.",
  },
  {
    icon: LayoutDashboard,
    title: "Manage your business",
    description:
      "Track listings, orders, bookings and activity from one dashboard.",
  },
];

const steps = [
  {
    title: "Create your account",
    description: "Create your Pawdigree vendor account.",
  },
  {
    title: "Set up your business",
    description: "Add your business info and complete verification.",
  },
  {
    title: "Add your listings",
    description: "Add products, pets and services to your profile.",
  },
  {
    title: "Connect with customers",
    description: "Start reaching customers and managing your business.",
  },
];

const dashboardStats = [
  { label: "LISTINGS", value: "128" },
  { label: "ORDERS", value: "342" },
  { label: "BOOKINGS", value: "57" },
  { label: "REVENUE", value: "4.8M" },
];

const recentOrders = [
  { name: "Dry Dog Food 5kg", status: "Pending" },
  { name: "Vet Consult – Max", status: "Confirmed" },
  { name: "Cat Litter Box", status: "Delivered" },
];

const salesBars = [38, 57, 45, 69, 53, 83, 61];

/* How-it-works stepper (i.e thepaw trail) */

const STEPS_AUTOPLAY_MS = 2800;

function PawIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="11" r="2.2" />
      <circle cx="9.5" cy="6" r="2.4" />
      <circle cx="14.5" cy="6" r="2.4" />
      <circle cx="19" cy="11" r="2.2" />
      <path d="M12 11.5c-3.2 0-6 3-6 5.8 0 1.9 1.5 2.9 3.1 2.9 1 0 1.8-.5 2.9-.5s1.9.5 2.9.5c1.6 0 3.1-1 3.1-2.9 0-2.8-2.8-5.8-6-5.8z" />
    </svg>
  );
}

function VendorSteps({
  steps,
}: {
  steps: { title: string; description: string }[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respectinh "reduce motion" settings
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Only animates while the section is on screen
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Autoplay of the pow
  useEffect(() => {
    if (paused || !inView || reduceMotion || steps.length < 2) return;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % steps.length),
      STEPS_AUTOPLAY_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, paused, inView, reduceMotion, steps.length]);

  return (
    <div
      ref={gridRef}
      className={`vendor-steps-grid${revealed ? " is-visible" : ""}`}
      style={{ "--i": active } as CSSProperties}
    >
      {/* Trail (for thw desktop only) */}
      <div className="vendor-steps-track" aria-hidden="true">
        <span className="vendor-steps-track-fill" />
      </div>
      <div className="vendor-steps-paw" aria-hidden="true">
        <span className="vendor-steps-paw-hop" key={active}>
          <PawIcon />
        </span>
      </div>

      {steps.map((step, index) => (
        <article
          className={`vendor-step${index === active ? " is-active" : ""}`}
          key={step.title}
          tabIndex={0}
          style={{ "--n": index } as CSSProperties}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") {
              setActive(index);
              setPaused(true);
            }
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setPaused(false);
          }}
          onClick={() => setActive(index)}
          onFocus={() => {
            setActive(index);
            setPaused(true);
          }}
          onBlur={() => setPaused(false)}
        >
          <span className="vendor-step-number">{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </article>
      ))}
    </div>
  );
}

function VendorLandingPage() {
  const [hideFloaties, setHideFloaties] = useState(false);

  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideFloaties(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // Scroll reveals
  useEffect(() => {
    const page = document.querySelector(".vendor-page");
    const elements = document.querySelectorAll(".vendor-reveal");

    if (!page || elements.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    // Enable scroll-reveal styles only when animations are supported.
    page.classList.add("vendor-reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="vendor-page" id="home">
      {/* HERO */}
      <section className="vendor-hero">
        <div className="vendor-cta-decoration" aria-hidden="true">
          <PawPrint className="vendor-cta-paw vendor-hero-paw-one" />
          <PawPrint className="vendor-cta-paw vendor-hero-paw-two" />
        </div>
        <img
          className="vendor-hero-bg"
          src={vendorHero}
          alt="A pet owner spending time with a dog"
        />

        <div className="vendor-hero-inner">
          <div className="vendor-hero-copy">
            <span className="vendor-eyebrow">For pet businesses</span>

            <h1>
              Grow your pet
              <br />
              business with
              <br />
              <span>Pawdigree</span>
            </h1>

            <p>
              Reach more pet owners, showcase your products and services, and
              manage your business from one place.
            </p>

            <div className="vendor-hero-actions">
              <Link
                className="vendor-button vendor-button-primary"
                to="/vendor/register"
              >
                Become a Vendor
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>

              <Link
                className="vendor-button vendor-button-outline"
                to="/vendor/login"
              >
                Log In
              </Link>
            </div>

            <p className="vendor-trust-note">
              <ShieldCheck size={16} aria-hidden="true" />
              Trusted by pet shops, vets &amp; groomers across Uganda
            </p>
          </div>
        </div>
        <div
          className={`vl-hero-floaties ${hideFloaties ? "v1-hidden" : ""}`}
          aria-hidden="true"
        >
          {/* Paw prints */}
          <svg
            className="vl-floaty vl-floaty-paw vl-paw-a"
            viewBox="0 0 100 100"
            fill="none"
          >
            <g stroke="currentColor" strokeWidth="5" strokeLinejoin="round">
              <ellipse
                cx="30"
                cy="29"
                rx="9"
                ry="15"
                transform="rotate(-25 30 29)"
              />
              <ellipse
                cx="43"
                cy="18"
                rx="9"
                ry="15"
                transform="rotate(-8 43 18)"
              />
              <ellipse
                cx="60"
                cy="18"
                rx="9"
                ry="15"
                transform="rotate(8 60 18)"
              />
              <ellipse
                cx="73"
                cy="29"
                rx="9"
                ry="15"
                transform="rotate(25 73 29)"
              />
              <path d="M23 62 C27 51 36 45 42 36 C46 30 54 30 58 36 C64 45 73 51 77 62 C82 75 72 82 61 78 C54 75 46 75 39 78 C32 82 22 75 23 62Z" />
            </g>
          </svg>

          <svg
            className="vl-floaty vl-floaty-bone vl-bone-a"
            viewBox="0 0 100 60"
            fill="none"
          >
            <path
              d="M29 19 C23 10 12 12 12 22 C12 27 16 30 20 30 L72 30 C76 30 80 27 80 22 C80 12 69 10 63 19 C59 25 53 26 50 22 C47 26 41 25 37 19Z"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="rotate(-25 50 30)"
            />
          </svg>

          <svg
            className="vl-floaty vl-floaty-heart vl-heart-a"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M20 34 C16 29 5 22 5 13 C5 4 16 2 20 11 C24 2 35 4 35 13 C35 22 24 29 20 34Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>

          <svg
            className="vl-floaty vl-floaty-sparkle vl-sparkle-a"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M20 0 L22 14 L36 16 L22 18 L20 32 L18 18 L4 16 L18 14Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>

          <svg
            className="vl-floaty vl-floaty-paw vl-paw-b"
            viewBox="0 0 100 100"
            fill="none"
          >
            <g stroke="currentColor" strokeWidth="5" strokeLinejoin="round">
              <ellipse
                cx="30"
                cy="29"
                rx="9"
                ry="15"
                transform="rotate(-25 30 29)"
              />
              <ellipse
                cx="43"
                cy="18"
                rx="9"
                ry="15"
                transform="rotate(-8 43 18)"
              />
              <ellipse
                cx="60"
                cy="18"
                rx="9"
                ry="15"
                transform="rotate(8 60 18)"
              />
              <ellipse
                cx="73"
                cy="29"
                rx="9"
                ry="15"
                transform="rotate(25 73 29)"
              />
              <path d="M23 62 C27 51 36 45 42 36 C46 30 54 30 58 36 C64 45 73 51 77 62 C82 75 72 82 61 78 C54 75 46 75 39 78 C32 82 22 75 23 62Z" />
            </g>
          </svg>

          <svg
            className="vl-floaty vl-floaty-sparkle vl-sparkle-b"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M20 0 L22 14 L36 16 L22 18 L20 32 L18 18 L4 16 L18 14Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>

          <svg
            className="vl-floaty vl-floaty-bone vl-bone-b"
            viewBox="0 0 100 60"
            fill="none"
          >
            <path
              d="M29 19 C23 10 12 12 12 22 C12 27 16 30 20 30 L72 30 C76 30 80 27 80 22 C80 12 69 10 63 19 C59 25 53 26 50 22 C47 26 41 25 37 19Z"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="rotate(-25 50 30)"
            />
          </svg>

          <svg
            className="vl-floaty vl-floaty-heart vl-heart-b"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M20 34 C16 29 5 22 5 13 C5 4 16 2 20 11 C24 2 35 4 35 13 C35 22 24 29 20 34Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* MARKETPLACE STATISTICS */}
      <section
        className="vendor-stats vendor-reveal"
        aria-label="Marketplace highlights"
      >
        <article className="vendor-stat-card">
          <UsersRound size={23} aria-hidden="true" />
          <strong>More customers</strong>
          <span>Expand your reach</span>
        </article>

        <article className="vendor-stat-card">
          <ShoppingBag size={23} aria-hidden="true" />
          <strong>More visibility</strong>
          <span>Showcase your offerings</span>
        </article>

        <article className="vendor-stat-card">
          <CalendarCheck size={23} aria-hidden="true" />
          <strong>Easy management</strong>
          <span>Keep bookings organized</span>
        </article>

        <article className="vendor-stat-card">
          <ChartNoAxesCombined size={23} aria-hidden="true" />
          <strong>One dashboard</strong>
          <span>Manage your business</span>
        </article>
      </section>

      {/* BENEFITS */}
      <section
        className="vendor-benefits section-container vendor-reveal"
        id="benefits"
      >
        <div className="vendor-section-heading">
          <span className="vendor-eyebrow">Why choose Pawdigree?</span>
          <h2>Everything you need to grow your pet business</h2>
          <p>
            One platform to reach customers, sell products, offer services and
            stay organized.
          </p>
        </div>

        <div className="vendor-benefit-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article className="vendor-benefit-card" key={benefit.title}>
                <span className="vendor-benefit-icon" aria-hidden="true">
                  <Icon size={26} strokeWidth={1.8} />
                </span>

                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="vendor-how-it-works section-container vendor-reveal"
        id="how-it-works"
      >
        <div className="vendor-section-heading">
          <span className="vendor-eyebrow">Getting started</span>
          <h2>How it works</h2>
          <p>Get your business live on Pawdigree in four simple steps.</p>
        </div>

        <VendorSteps steps={steps} />
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="vendor-dashboard-section section-container vendor-reveal">
        <div className="vendor-dashboard-copy">
          <span className="vendor-eyebrow">Your business at a glance</span>

          <h2>
            Your business.
            <br />
            One dashboard.
          </h2>

          <p>
            Manage your products, pets, services, bookings and orders from one
            organized workspace.
          </p>

          <ul>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Real-time order &amp; booking tracking
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Simple listing management
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              Business performance at a glance
            </li>
          </ul>

          <Link className="vendor-text-link" to="/vendor/register">
            Start growing your business
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div
          className="vendor-dashboard-preview"
          aria-label="Illustrative vendor dashboard preview"
        >
          <div className="vendor-dashboard-topbar">
            <span className="vendor-dashboard-title">
              <LayoutDashboard size={19} aria-hidden="true" />
              Vendor Dashboard
            </span>
            <span className="vendor-dashboard-avatar" aria-hidden="true" />
          </div>

          <div className="vendor-dashboard-content">
            <div className="vendor-dashboard-stats">
              {dashboardStats.map((stat) => (
                <article className="vendor-dashboard-stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>

            <div className="vendor-dashboard-panels">
              <section className="vendor-chart-panel">
                <h3>
                  <ChartNoAxesCombined size={17} aria-hidden="true" />
                  Sales this month
                </h3>

                <div
                  className="vendor-chart"
                  role="img"
                  aria-label="Illustrative monthly sales bar chart"
                >
                  {salesBars.map((height, index) => (
                    <span
                      className={
                        index === 5
                          ? "vendor-chart-bar highlight"
                          : "vendor-chart-bar"
                      }
                      style={{ height: `${height}%` }}
                      key={index}
                    />
                  ))}
                </div>
              </section>

              <section className="vendor-orders-panel">
                <h3>
                  <ShoppingBag size={17} aria-hidden="true" />
                  Recent orders
                </h3>

                {recentOrders.map((order) => (
                  <div className="vendor-order-row" key={order.name}>
                    <span>{order.name}</span>

                    <strong
                      className={`vendor-order-status vendor-status-${order.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {order.status}
                    </strong>
                  </div>
                ))}
              </section>
            </div>

            <p className="vendor-preview-note">
              Illustrative dashboard preview
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="vendor-cta-section section-container vendor-reveal">
        <div className="vendor-cta-decoration" aria-hidden="true">
          <PawPrint className="vendor-cta-paw vendor-cta-paw-one" />
          <PawPrint className="vendor-cta-paw vendor-cta-paw-two" />
        </div>

        <div className="vendor-cta-content">
          <span className="vendor-eyebrow">Your next chapter starts here</span>

          <h2>Ready to grow with Pawdigree?</h2>

          <p>
            Bring your pet business to a platform built to connect you
            <br className="vendor-desktop-break" />
            with the people who care about pets.
          </p>

          <Link
            className="vendor-button vendor-button-primary-cta"
            to="/vendor/register"
          >
            Become a Vendor
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>

          <p className="vendor-cta-login">
            Already have a vendor account?{" "}
            <Link to="/vendor/login">Log in</Link>
          </p>
        </div>
      </section>

      {/* FOOTER - Commented out temporarily till vendor-footer is added to the shared folder*/}
      {/*<footer className="vendor-footer" id="vendor-footer">
          <div className="vendor-footer-inner">
            <div className="vendor-footer-brand">
              <a
                className="vendor-logo vendor-footer-logo"
                href="#home"
                aria-label="Pawdigree home"
              >
                <img src={logo} alt="Pawdigree" />
              </a>

              <p>
                Your trusted digital marketplace for pets, pet products and
                pet-care services.
              </p>
            </div>

            <div className="vendor-footer-column">
              <h3>Platform</h3>
              <a href="#home">About Pawdigree</a>
              <a href="#benefits">Why Pawdigree</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#footer-contact">Contact</a>
            </div>

            <div className="vendor-footer-column">
              <h3>For Vendors</h3>
              <Link to="/vendor/register">Become a Vendor</Link>
              <Link to="/vendor/login">Vendor Login</Link>
              <a href="#benefits">Vendor Benefits</a>
              <Link to="/vendor/register">Verification</Link>
            </div>

            <div className="vendor-footer-bottom" id="footer-contact">
              <span>© 2026 Pawdigree. All rights reserved.</span>

              <div>
                <Link to="/privacy">Privacy Policy</Link>
                <span aria-hidden="true"> · </span>
                <Link to="/terms-and-conditions">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>*/}
    </main>
  );
}

export default VendorLandingPage;

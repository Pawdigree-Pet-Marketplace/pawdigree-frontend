
import { useEffect } from "react";
import "./VendorLandingPage.css";
import vendorHero from "../assets/images/vendor-hero.jpg";
import vendorHero2 from "../assets/images/vendor-hero2.jpg";
import logo from "../assets/logos/lightmode-logo.svg";

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
    description:
      "List and manage your pet products in one place.",
  },
  {
    icon: Stethoscope,
    title: "Offer pet services",
    description:
      "Promote your services and manage customer bookings.",
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

function VendorLandingPage() {
  useEffect(() => {
    const page = document.querySelector(".vendor-page");
    const elements = document.querySelectorAll(".vendor-reveal");

    if (!page || elements.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
      prefersReducedMotion ||
      !("IntersectionObserver" in window)
    ) {
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
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="vendor-page" id="home">
      {/* NAVIGATION */}
      <header className="vendor-navbar">
        <a className="vendor-logo" href="#home" aria-label="Pawdigree home">
          <img src={logo} alt="Pawdigree" />
        </a>

        <nav className="vendor-nav-links" aria-label="Main navigation">
          <a className="active" href="#home">
            Home
          </a>
          <a href="#benefits">Why Pawdigree</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#benefits">Benefits</a>
        </nav>

        <div className="vendor-nav-actions">
          <a className="vendor-login-link" href="/vendor/login">
            Log In
          </a>
          <a
            className="vendor-button vendor-button-primary"
            href="/vendor/register"
          >
            Become a Vendor
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="vendor-hero vendor-reveal">
        <div className="vendor-hero-copy">
          <span className="vendor-eyebrow">
            <PawPrint size={15} aria-hidden="true" />
            For pet businesses
          </span>

          <h1>
            Grow your pet
            <br />
            business with
            <br />
            <span>Pawdigree</span>
          </h1>

          <p>
            Reach more pet owners, showcase your products and
            services, and manage your business from one place.
          </p>

          <div className="vendor-hero-actions">
            <a
              className="vendor-button vendor-button-primary"
              href="/vendor/register"
            >
              Become a Vendor
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>

            <a
              className="vendor-button vendor-button-outline"
              href="/vendor/login"
            >
              Log In
            </a>
          </div>

          <p className="vendor-trust-note">
            <ShieldCheck size={16} aria-hidden="true" />
            Trusted by pet shops, vets &amp; groomers across Uganda
          </p>
        </div>

        <div className="vendor-hero-visual">
          <div className="vendor-hero-photo vendor-hero-photo-main">
            <img
              src={vendorHero}
              alt="A pet owner spending time with a dog"
            />
            <span className="vendor-photo-caption">
              <CheckCircle2 size={15} aria-hidden="true" />
              Verified vendor
            </span>
          </div>

          <div className="vendor-hero-photo vendor-hero-photo-small">
            <img src={vendorHero2} alt="A happy dog outdoors" />
          </div>
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
            One platform to reach customers, sell products, offer
            services and stay organized.
          </p>
        </div>

        <div className="vendor-benefit-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                className="vendor-benefit-card"
                key={benefit.title}
              >
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
          <p>
            Get your business live on Pawdigree in four simple steps.
          </p>
        </div>

        <div className="vendor-steps-grid">
          {steps.map((step, index) => (
            <article className="vendor-step" key={step.title}>
              <span className="vendor-step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
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
            Manage your products, pets, services, bookings and orders
            from one organized workspace.
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

          <a
            className="vendor-text-link"
            href="/vendor/register"
          >
            Start growing your business
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
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
            <span
              className="vendor-dashboard-avatar"
              aria-hidden="true"
            />
          </div>

          <div className="vendor-dashboard-content">
            <div className="vendor-dashboard-stats">
              {dashboardStats.map((stat) => (
                <article
                  className="vendor-dashboard-stat"
                  key={stat.label}
                >
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>

            <div className="vendor-dashboard-panels">
              <section className="vendor-chart-panel">
                <h3>
                  <ChartNoAxesCombined
                    size={17}
                    aria-hidden="true"
                  />
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
        <div
          className="vendor-cta-decoration"
          aria-hidden="true"
        >
          <PawPrint className="vendor-cta-paw vendor-cta-paw-one" />
          <PawPrint className="vendor-cta-paw vendor-cta-paw-two" />
        </div>

        <div className="vendor-cta-content">
          <span className="vendor-eyebrow">
            Your next chapter starts here
          </span>

          <h2>Ready to grow with Pawdigree?</h2>

          <p>
            Bring your pet business to a platform built to connect you
            <br className="vendor-desktop-break" />
            with the people who care about pets.
          </p>

          <a
            className="vendor-button vendor-button-primary"
            href="/vendor/register"
          >
            Become a Vendor
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>

          <p className="vendor-cta-login">
            Already have a vendor account?{" "}
            <a href="/vendor/login">Log in</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="vendor-footer">
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
              Your trusted digital marketplace for pets, pet products
              and pet-care services.
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
            <a href="/vendor/register">Become a Vendor</a>
            <a href="/vendor/login">Vendor Login</a>
            <a href="#benefits">Vendor Benefits</a>
            <a href="/vendor/register">Verification</a>
          </div>

          <div className="vendor-footer-bottom" id="footer-contact">
            <span>© 2026 Pawdigree. All rights reserved.</span>

            <div>
              <a href="/privacy">Privacy Policy</a>
              <span aria-hidden="true"> · </span>
              <a href="/terms-and-conditions">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default VendorLandingPage;

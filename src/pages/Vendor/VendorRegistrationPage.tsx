
import { useState } from "react";
import { Link } from "react-router-dom";

import VendorRegistrationForm from "../../components/VendorRegistrationForm/VendorRegistrationForm";
import Footer from "../../components/layout/Footer";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";

import lightLogo from "../../assets/logos/lightmode-logo.svg";
import "./VendorRegistrationPage.css";

function VendorRegistrationPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Customer navigation bar */}
      <TopNavbar
        isLoggedIn={false}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      {/* Side navigation menu */}
      <SideMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        isLoggedIn={false}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="vendor-registration-page-wrapper">
        {/* Vendor registration top bar */}
        <header className="vendor-page-topbar">
          <Link
            to="/"
            className="vendor-brand"
            aria-label="Pawdigree home"
          >
            <img
              src={lightLogo}
              alt="Pawdigree"
              className="vendor-logo-img"
            />
          </Link>

          <p className="vendor-signin-prompt">
            Already a vendor?{" "}
            <Link to="/vendor/login" className="vendor-signin-link">
              Sign in
            </Link>
          </p>
        </header>

        {/* Registration content */}
        <main className="vendor-registration-main">
          <section className="vendor-registration-intro">
            <span className="vendor-registration-eyebrow">
              JOIN THE PAWDIGREE COMMUNITY
            </span>

            <h1>
              Grow your business
              <span> with Pawdigree.</span>
            </h1>

            <p className="vendor-registration-description">
              Connect with pet owners, showcase your products and services,
              and grow your business in Uganda&apos;s pet marketplace.
            </p>

            <div className="vendor-registration-benefits">
  <div className="vendor-registration-benefit">
    <span className="vendor-benefit-mark" aria-hidden="true">
      ♥
    </span>
    <div>
      <h2>Showcase your business</h2>
      <p>Display your pet products and services to potential customers.</p>
    </div>
  </div>

  <div className="vendor-registration-benefit">
    <span className="vendor-benefit-mark" aria-hidden="true">
      ✓
    </span>
    <div>
      <h2>Connect with pet owners</h2>
      <p>Reach people who care about pets and need your services.</p>
    </div>
  </div>

  <div className="vendor-registration-benefit">
    <span className="vendor-benefit-mark" aria-hidden="true">
      ★
    </span>
    <div>
      <h2>Build trust with verification</h2>
      <p>Strengthen customer confidence through vendor verification.</p>
    </div>
  </div>
</div>
          </section>

          {/* Registration form */}
          <section
            className="vendor-registration-form-section"
            aria-label="Vendor registration"
          >
            <VendorRegistrationForm />
          </section>
        </main>

        {/* Shared marketplace footer */}
        <Footer />
      </div>

      {/* Bottom navigation */}
      <BottomNavbar />
    </>
  );
}

export default VendorRegistrationPage;

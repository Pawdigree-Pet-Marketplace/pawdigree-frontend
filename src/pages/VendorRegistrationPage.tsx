import VendorRegistrationForm from "../components/VendorRegistrationForm/VendorRegistrationForm";
import lightLogo from "../assets/logos/lightmode-logo.svg";
import "./VendorRegistrationPage.css";

function VendorRegistrationPage() {
  return (
    <div className="vendor-registration-page-wrapper">
      <header className="vendor-page-topbar">
        <a href="/" className="vendor-brand">
          <img src={lightLogo} alt="Pawdigree" className="vendor-logo-img" />
        </a>
        <a href="/vendor/login" className="vendor-signin-link">
          Already a vendor? Sign In
        </a>
      </header>

      <VendorRegistrationForm />

      <footer className="vendor-page-footer">
        <p>
          Already have an account? <a href="/login">Sign in</a>
        </p>
        <p className="legal">
          By creating an account, you agree to Pawdigree's{" "}
          <a href="/terms">Terms of Service</a> and{" "}
          <a href="/privacy">Privacy Policy</a>. <br />
          Terms and conditions apply. All vendor accounts are subject to
          verification.
        </p>
      </footer>
    </div>
  );
}

export default VendorRegistrationPage;

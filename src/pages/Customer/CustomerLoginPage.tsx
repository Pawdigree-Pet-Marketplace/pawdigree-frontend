import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, PawPrint, Store } from "lucide-react";
import "./CustomerLoginPage.css";
import logo from "../../assets/logos/icon-logo.svg";
import CustomerLoginForm from "../../components/auth/CustomerLoginForm";

type Step = "welcome" | "password" | "phone";

export default function CustomerLoginPage() {
  useEffect(() => {
    document.title = "Customer Login - Pawdigree";
  }, []);

  const [step, setStep] = useState<Step>("welcome");

  const handleBack = () => {
    if (step === "phone") {
      setStep("password");
      return;
    }
    if (step === "password") {
      setStep("welcome");
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className={`login-page ${step === "welcome" ? "login-page--role-selection" : ""}`}>
      <div className="top-bar">
        {step === "welcome" ? (
          <>
            <div className="role-brand">
              <img src={logo} alt="" className="role-brand-logo" />
              <span>Pawdigree</span>
            </div>
            <button
              type="button"
              className="back-btn"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="back-btn"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="top-bar-title">
              {step === "password" ? "Welcome back" : "Verify Phone"}
            </span>
            <div className="spacer" />
          </>
        )}
      </div>

      <div className="login-card">
        {step === "welcome" && (
          <div className="welcome-content">
            <div className="login-logo">
              <img src={logo} alt="Pawdigree logo" className="real-logo" />
            </div>

            <p className="role-eyebrow">WELCOME TO PAWDIGREE</p>
            <h1>How would you like to continue?</h1>
            <p className="subtitle">
              One home for pet lovers and pet businesses.
            </p>

            <div className="role-options">
              <button
                type="button"
                className="role-card"
                onClick={() => setStep("password")}
              >
                <span className="role-icon" aria-hidden="true">
                  <PawPrint size={26} strokeWidth={1.8} />
                </span>
                <span className="role-title">I'm here for the pets!</span>
                <span className="role-description">
                  Discover pets, shop, and explore services.
                </span>
                <span className="role-action">Continue as Customer →</span>
              </button>

              <button
                type="button"
                className="role-card"
                onClick={() => {
                  window.location.href = "/vendor/login";
                }}
              >
                <span className="role-icon" aria-hidden="true">
                  <Store size={26} strokeWidth={1.8} />
                </span>
                <span className="role-title">
                  I'm here to grow my pet business!
                </span>
                <span className="role-description">
                  Manage your pet business and listings.
                </span>
                <span className="role-action">Continue as Vendor <ArrowRight size={16} /></span>
              </button>
            </div>

            <p className="bottom-link">
              New to Pawdigree?{" "}
              <a href="/registration">Create an account</a>
            </p>

            <p className="terms">
              By continuing you agree to Pawdigree's{" "}
              <a href="/terms-and-conditions">Terms &amp; Conditions</a> and{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
        )}

        {step === "password" && (
          <>
            <CustomerLoginForm />
          </>
        )}

        {step === "phone" && (
          <div className="verify-content">
            <div className="verify-box">
              <h3>Phone-code login isn't ready yet</h3>
              <p>
                Please go back and log in with your registered email and
                password.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary full"
              onClick={() => setStep("password")}
            >
              Back to email login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

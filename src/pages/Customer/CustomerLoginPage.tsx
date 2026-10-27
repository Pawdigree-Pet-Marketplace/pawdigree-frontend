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
    window.location.href = "/";
  };

  return (
    <div className={`login-page ${step === "welcome" ? "login-page--role-selection" : "login-page--auth"}`}>
      <div className="top-bar">
        <button type="button" className="back-btn" onClick={handleBack} aria-label="Go back">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="role-brand">
          <img src={logo} alt="Pawdigree" className="role-brand-logo" />
          <span>Pawdigree</span>
        </div>
        {step !== "welcome" && (
          <span className="top-bar-title">
            {step === "password" ? "Welcome back" : "Verify Phone"}
          </span>
        )}
      </div>

      <div className="login-card">
        {step === "welcome" && (
          <div className="welcome-content">
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

      {step !== "welcome" && (
        <aside className="login-welcome-panel login-welcome-panel--customer">
          <div className="login-welcome-copy">
            <span className="login-welcome-kicker">A LITTLE MORE JOY, EVERY DAY</span>
            <h1>Good things are waiting for you and your pet.</h1>
            <p>Find trusted care, discover lovely local businesses, and make more happy memories together.</p>
            <div className="login-fact-card">
              <span className="login-fact-icon" aria-hidden="true"><PawPrint size={20} /></span>
              <span><strong>Made for pet people</strong><small>Explore services and pet-friendly finds in one welcoming place.</small></span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

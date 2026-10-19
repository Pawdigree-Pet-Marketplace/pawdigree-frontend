import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
    <div className="login-page">
      <div className="top-bar">
        <button
          type="button"
          className="back-btn"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="top-bar-title">
          {step === "welcome"
            ? "Customer Login"
            : step === "password"
              ? "Welcome back"
              : "Verify Phone"}
        </span>
        <div className="spacer" />
      </div>

      <div className="login-card">
        {step === "welcome" && (
          <div className="welcome-content">
            <div className="login-logo">
              <img src={logo} alt="Pawdigree logo" className="real-logo" />
            </div>
            <h1>Login</h1>
            <p className="subtitle">Log in or create an account to continue.</p>

            <div className="login-illustration">
              <img
                src="/pets-illustration.svg"
                alt="pets"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>

            <div className="login-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep("password")}
              >
                Login
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => (window.location.href = "/registration")}
              >
                Create account
              </button>
            </div>

            <p className="terms">
              By continuing you agree to Pawdigree's <a href="#">T&Cs</a> and{" "}
              <a href="#">Privacy Policy</a>
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

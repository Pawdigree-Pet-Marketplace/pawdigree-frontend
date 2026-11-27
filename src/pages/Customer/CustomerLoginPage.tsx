import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, PawPrint, Store } from "lucide-react";
import "./CustomerLoginPage.css";
import CustomerLoginForm from "../../components/auth/CustomerLoginForm";
import BackButton from "../../components/BackButton/BackButton";

type Step = "welcome" | "password" | "phone";

export default function CustomerLoginPage() {
  const [step, setStep] = useState<Step>("welcome");

  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    document.title = "Customer Login - Pawdigree";
  }, []);

  const handleBack = () => {
    if (step === "phone") {
      setStep("password");
      return;
    }
    if (step === "password") {
      setStep("welcome");
      return;
    }
    navigate("/");
  };

  return (
    <div
      className={`login-page ${step === "welcome" ? "login-page--role-selection" : "login-page--auth"}`}
    >
      <div className="login-card">
        {step !== "welcome" && <BackButton onClick={handleBack} />}

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
                <span className="role-action">
                  Continue as Customer <ArrowRight size={16} />
                </span>
              </button>

              <button
                type="button"
                className="role-card"
                onClick={() => {
                  navigate("/vendor/login", { replace: true });
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
                <span className="role-action">
                  Continue as Vendor <ArrowRight size={16} />
                </span>
              </button>
            </div>

            <p className="bottom-link">
              New to Pawdigree?{" "}
              <Link to="/registration" state={location.state}>Create an account</Link>
            </p>

            <p className="terms">
              By continuing you agree to Pawdigree's{" "}
              <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        )}

        {step === "password" && <CustomerLoginForm />}

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
            <span className="login-welcome-kicker">
              A LITTLE MORE JOY, EVERY DAY
            </span>
            <h1>Good things are waiting for you and your pet.</h1>
            <p>
              Find trusted care, discover lovely local businesses, and make more
              happy memories together.
            </p>
            <div className="login-fact-card">
              <span className="login-fact-icon" aria-hidden="true">
                <PawPrint size={20} />
              </span>
              <span>
                <strong>Made for pet people</strong>
                <small>
                  Explore services and pet-friendly finds in one welcoming
                  place.
                </small>
              </span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

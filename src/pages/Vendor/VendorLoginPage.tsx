import { useEffect, useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  Store,
  Users,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { apiRequest } from "../../services/api";
import {
  clearAuthSession,
  saveAuthSession,
} from "../../services/auth/authStorage";
import { Link, useNavigate } from "react-router-dom";
import "./VendorLoginPage.css";
import BackButton from "../../components/BackButton/BackButton";

type LoginResponse = {
  access?: string;
  refresh?: string;
  verification_required?: boolean;
  verification_token?: string;
  email?: string;
  masked_email?: string;
  email_sent?: boolean;
  expires_in?: number;
  resend_available_in?: number;
};

function Required() {
  return (
    <span className="required-star" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export default function VendorLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Vendor Login - Pawdigree";
  }, []);

  function clearErrors() {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    let hasErrors = false;

    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      hasErrors = true;
    }

    if (!password) {
      setPasswordError("Please enter your password.");
      hasErrors = true;
    }

    if (hasErrors) return;

    setIsSubmitting(true);

    try {
      const data = await apiRequest<LoginResponse>("/auth/login/vendor/", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      // Email verification must happen before authentication tokens are saved.
      if (data.verification_required) {
        const verificationToken = data.verification_token;

        if (!verificationToken) {
          setGeneralError(
            "We couldn't start email verification. Please try signing in again.",
          );
          return;
        }

        clearAuthSession();
        sessionStorage.setItem(
          "pawdigree_email_verification",
          JSON.stringify({
            verificationToken,
            email: data.masked_email ?? data.email ?? email.trim(),
            role: "VENDOR",
            keepLoggedIn,
            expiresAt: Date.now() + (data.expires_in ?? 600) * 1000,
            resendAt: Date.now() + (data.resend_available_in ?? 60) * 1000,
          }),
        );
        navigate("/verify-email");
        return;
      }

      // Normal login must return both authentication tokens.
      const accessToken = data.access;
      const refreshToken = data.refresh;

      if (!accessToken || !refreshToken) {
        setGeneralError("We couldn't complete sign-in. Please try again.");
        return;
      }

      saveAuthSession(
        { access: accessToken, refresh: refreshToken, role: "VENDOR" },
        keepLoggedIn,
      );

      navigate("/vendor/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes("failed to fetch") ||
        normalizedMessage.includes("networkerror") ||
        normalizedMessage.includes("network request failed")
      ) {
        setGeneralError(
          "We can't connect right now. Please check your connection and try again.",
        );
      } else if (
        normalizedMessage.includes("non_field_errors") ||
        normalizedMessage.includes("invalid credentials") ||
        normalizedMessage.includes("invalid email or password") ||
        normalizedMessage.includes("no active account") ||
        normalizedMessage.includes("incorrect") ||
        normalizedMessage.includes("not found") ||
        normalizedMessage.includes("unable to log in") ||
        normalizedMessage.includes("unauthorized")
      ) {
        setPasswordError(
          "Incorrect email or password. Please check your details and try again.",
        );
      } else {
        setGeneralError("Something went wrong. Please try again in a moment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="vendor-login-page">
      <section className="vendor-login-card">
        <BackButton
          label="Back"
          fallback="/vendor"
          onClick={() => navigate("/vendor")}
        />

        <div className="vendor-login-icon">
          <Store size={28} />
        </div>

        <p className="vendor-login-eyebrow">PAWDIGREE FOR BUSINESS</p>

        <h1>Welcome back!</h1>

        <p className="vendor-login-description">
          Sign in to manage your store, listings, orders and bookings.
        </p>

        {generalError && (
          <p className="vendor-login-error" role="alert">
            {generalError}
          </p>
        )}

        <form onSubmit={handleLogin} noValidate>
          <p className="vendor-required-note">
            Fields marked <span className="required-star">*</span> are required.
          </p>

          <div className="vendor-login-field">
            <label htmlFor="vendor-email">
              Email address
              <Required />
            </label>

            <input
              id="vendor-email"
              type="email"
              autoComplete="email"
              placeholder="you@yourbusiness.com"
              value={email}
              aria-required="true"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "vendor-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
                setPasswordError("");
                setGeneralError("");
              }}
            />

            {emailError && (
              <p
                id="vendor-email-error"
                className="vendor-field-error"
                role="alert"
              >
                <span className="vendor-error-icon" aria-hidden="true">
                  !
                </span>
                {emailError}
              </p>
            )}
          </div>

          <div className="vendor-login-field">
            <label htmlFor="vendor-password">
              Password
              <Required />
            </label>

            <div
              className={`vendor-password-wrapper ${
                passwordError ? "has-error" : ""
              }`}
            >
              <input
                id="vendor-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                aria-required="true"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={
                  passwordError ? "vendor-password-error" : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError("");
                  setGeneralError("");
                }}
              />

              <button
                type="button"
                className="vendor-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {passwordError && (
              <p
                id="vendor-password-error"
                className="vendor-field-error"
                role="alert"
              >
                <span className="vendor-error-icon" aria-hidden="true">
                  !
                </span>
                {passwordError}
              </p>
            )}
          </div>

          <div className="vendor-login-options">
            <label className="vendor-remember">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(event) => setKeepLoggedIn(event.target.checked)}
              />
              Keep me logged in
            </label>

            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="vendor-login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in to your store"}
          </button>
        </form>

        <p className="vendor-login-register">
          Not a vendor yet? <Link to="/vendor/register">Become a vendor</Link>
        </p>
      </section>

      <aside className="vendor-login-welcome">
        <span className="vendor-login-welcome-kicker">
          PAWDIGREE FOR PET PROS
        </span>
        <h2>Big things start with the care you give.</h2>
        <p className="vendor-login-welcome-text">
          Bring your pet business to a community that loves animals as much as
          you do.
        </p>

        <div className="vendor-login-benefits">
          <div className="vendor-login-benefit">
            <span className="vendor-benefit-icon" aria-hidden="true">
              <Users size={20} />
            </span>
            <div>
              <h3>Reach local pet owners</h3>
              <p>Showcase your services and connect with customers.</p>
            </div>
          </div>

          <div className="vendor-login-benefit">
            <span className="vendor-benefit-icon" aria-hidden="true">
              <LayoutDashboard size={20} />
            </span>
            <div>
              <h3>Manage everything in one place</h3>
              <p>Listings, orders and bookings from a single dashboard.</p>
            </div>
          </div>

          <div className="vendor-login-benefit">
            <span className="vendor-benefit-icon" aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3>Build trust with verification</h3>
              <p>Verified vendors earn more customer confidence.</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

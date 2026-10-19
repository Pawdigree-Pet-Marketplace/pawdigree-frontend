
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Store } from "lucide-react";
import { apiRequest } from "../../services/api";
import logo from "../../assets/logos/lightmode-logo.svg";
import "./VendorLoginPage.css";

type LoginResponse = {
  access: string;
  refresh: string;
};

export default function VendorLoginPage() {
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
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
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
      const data = await apiRequest<LoginResponse>(
        "/auth/login/vendor/",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      // Remove old authentication data before saving the new session.
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("token");
        storage.removeItem("refresh");
        storage.removeItem("role");
      }

      const storage = keepLoggedIn ? localStorage : sessionStorage;

      storage.setItem("token", data.access);
      storage.setItem("refresh", data.refresh);
      storage.setItem("role", "VENDOR");

      window.location.href = "/vendor/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "";

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
        setGeneralError(
          "Something went wrong. Please try again in a moment.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="vendor-login-page">
      <header className="vendor-login-header">
        <button
          type="button"
          className="vendor-login-back"
          onClick={() => {
            window.location.href = "/vendor";
          }}
          aria-label="Back to vendor landing page"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <a href="/vendor" aria-label="Pawdigree vendor home">
          <img src={logo} alt="Pawdigree" />
        </a>
      </header>

      <section className="vendor-login-card">
        <div className="vendor-login-icon">
          <Store size={28} />
        </div>

        <p className="vendor-login-eyebrow">
          PAWDIGREE FOR BUSINESS
        </p>

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
          <div className="vendor-login-field">
            <label htmlFor="vendor-email">Email address</label>

            <input
              id="vendor-email"
              type="email"
              autoComplete="email"
              placeholder="you@yourbusiness.com"
              value={email}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError ? "vendor-email-error" : undefined
              }
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
            <label htmlFor="vendor-password">Password</label>

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
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
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
                onChange={(event) =>
                  setKeepLoggedIn(event.target.checked)
                }
              />
              Keep me logged in
            </label>

            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="vendor-login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in to your store"}
          </button>
        </form>

        <p className="vendor-login-register">
          Not a vendor yet?{" "}
          <a href="/vendor/register">Become a vendor</a>
        </p>
      </section>

      <footer className="vendor-login-footer">
        Your business, growing with Pawdigree.
      </footer>
    </main>
  );
}

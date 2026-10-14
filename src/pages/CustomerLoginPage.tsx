import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import "./CustomerLoginPage.css";
import logo from "../assets/logos/icon-logo.svg";
import { apiRequest } from "../services/api";

type Step = "welcome" | "password" | "phone";

export default function CustomerLoginPage() {
  useEffect(() => {
    document.title = "Customer Login - Pawdigree";
  }, []);

  const [step, setStep] = useState<Step>("welcome");
  const [isEditing, setIsEditing] = useState(false);
  const [isPhoneMode, setIsPhoneMode] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const getDisplayName = () => {
    if (identifier.includes("@")) {
      const name = identifier.split("@")[0].split(/[._]/)[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }

    return "there";
  };

  const validateIdentifier = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Email or phone is required";
    }

    const isPhoneLike =
      /^[+0-9\s()-]+$/.test(trimmed) && /\d/.test(trimmed);

    if (isPhoneLike) {
      const phone = parsePhoneNumberFromString(trimmed, "UG");

      if (!phone || !phone.isValid()) {
        return "Enter a valid phone number (e.g. +256 772 123 456)";
      }

      return "";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(trimmed)) {
      return "Enter a valid email (e.g. name@email.com)";
    }

    return "";
  };

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

  const handleWelcomeLogin = () => {
    setStep("password");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");

    const newErrors: {
      identifier?: string;
      password?: string;
    } = {};

    // The Django customer login endpoint currently authenticates by email.
    if (isPhoneMode) {
      newErrors.identifier =
        "Phone login is not available yet. Please use your email.";
    } else {
      newErrors.identifier = validateIdentifier(identifier);

      if (!identifier.includes("@")) {
        newErrors.identifier =
          "Please use the email address registered to your account.";
      }
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (newErrors.identifier || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const data = await apiRequest<{
        access: string;
        refresh: string;
      }>("/auth/login/customer/", {
        method: "POST",
        body: JSON.stringify({
          email: identifier.trim(),
          password,
        }),
      });

      // Remove old credentials so a stale or fake token is not reused.
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      localStorage.removeItem("role");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refresh");
      sessionStorage.removeItem("role");

      // Keep the real tokens in the selected storage location.
      const storage = keepLoggedIn ? localStorage : sessionStorage;

      storage.setItem("token", data.access);
      storage.setItem("refresh", data.refresh);
      storage.setItem("role", "CUSTOMER");

      window.location.href = "/";
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentEditingValue = isPhoneMode ? phoneInput : emailInput;
  const isCurrentInvalid = !!validateIdentifier(currentEditingValue);

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

            <p className="subtitle">
              Log in or create an account to continue.
            </p>

            <div className="login-illustration">
              <img
                src="/pets-illustration.svg"
                alt="pets"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="login-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleWelcomeLogin}
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
          <form className="form-content" onSubmit={handleLogin} noValidate>
            <h2>Welcome back, {getDisplayName()}</h2>

            <p className="subtitle">
              Enter your password to log in to your account.
            </p>

            {loginError && (
              <p
                className="err"
                role="alert"
                style={{ whiteSpace: "pre-line" }}
              >
                {loginError}
              </p>
            )}

            <div className="field">
              <label>
                {isPhoneMode ? "Phone" : "Email"}

                <button
                  type="button"
                  className="switch-link"
                  onClick={() => {
                    setIsPhoneMode(!isPhoneMode);
                    setIsEditing(true);
                    setErrors({});
                    setLoginError("");
                  }}
                >
                  {isPhoneMode ? "(or email)" : "(or phone)"}
                </button>
              </label>

              <div className="email-row">
                {isEditing ? (
                  <input
                    type={isPhoneMode ? "tel" : "email"}
                    value={currentEditingValue}
                    onChange={(event) => {
                      const newValue = event.target.value;

                      if (isPhoneMode) {
                        setPhoneInput(newValue);
                      } else {
                        setEmailInput(newValue);
                      }

                      setLoginError("");

                      const error = validateIdentifier(newValue);

                      setErrors((previous) => ({
                        ...previous,
                        identifier: error || undefined,
                      }));
                    }}
                    placeholder={
                      isPhoneMode ? "+256 772 123 456" : "name@email.com"
                    }
                    className={errors.identifier ? "has-error" : ""}
                  />
                ) : (
                  <input value={identifier} readOnly aria-label="Email" />
                )}

                <button
                  type="button"
                  className="change-btn"
                  disabled={isEditing && isCurrentInvalid}
                  style={{
                    opacity: isEditing && isCurrentInvalid ? 0.4 : 1,
                    cursor:
                      isEditing && isCurrentInvalid
                        ? "not-allowed"
                        : "pointer",
                  }}
                  onClick={() => {
                    if (isEditing) {
                      const value = currentEditingValue;
                      const error = validateIdentifier(value);

                      if (error) {
                        setErrors({ identifier: error });
                        return;
                      }

                      setIdentifier(value.trim());
                      setErrors({});
                      setLoginError("");
                    }

                    setIsEditing(!isEditing);
                  }}
                >
                  {isEditing ? "Save" : "Change"}
                </button>
              </div>

              {errors.identifier && (
                <span className="err">{errors.identifier}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="customer-password">Password</label>

              <div className="password-wrap">
                <input
                  id="customer-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setLoginError("");
                    setErrors((previous) => ({
                      ...previous,
                      password: undefined,
                    }));
                  }}
                  placeholder="••••••••••"
                  className={errors.password ? "has-error" : ""}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {errors.password && (
                <span className="err">{errors.password}</span>
              )}
            </div>

            <div className="form-row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(event) => setKeepLoggedIn(event.target.checked)}
                />{" "}
                Keep me logged in
              </label>

              <a href="/forgot-password" className="forgot">
                Forgot password?
              </a>

            </div>

            <button
              type="submit"
              className="btn-primary full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="btn-outline full"
              onClick={() => {
                setLoginError("");
                setStep("phone");
              }}
            >
              Log in with phone code
            </button>

            <p className="bottom-link">
              Don't have an account?{" "}
              <a href="/registration">Create account</a>
            </p>
          </form>
        )}

        {step === "phone" && (
          <div className="verify-content">
            <div className="verify-box">
              <h3>Phone-code login isn't ready yet</h3>

              <p role="status">
                Phone verification has not been connected to the backend yet.
                No code has been sent. Please go back and log in with your
                registered email and password.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary full"
              onClick={() => {
                setIsPhoneMode(false);
                setStep("password");
              }}
            >
              Back to email login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

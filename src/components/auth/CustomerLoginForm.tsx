
import { useState } from "react";
import type { FormEvent } from "react";
import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import "./CustomerLoginForm.css";
import { apiRequest } from "../../services/api";
import logo from "../../assets/logos/icon-logo.svg";

export default function CustomerLoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isEmailEmpty = !identifier.trim();
  const isEmailInvalid =
    !isEmailEmpty && !emailRegex.test(identifier.trim());
  const isPasswordEmpty = !password;

  const showEmailError =
    touched.email && (isEmailEmpty || isEmailInvalid);
  const showPasswordError =
    touched.password && isPasswordEmpty;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({ email: true, password: true });
    setLoginError("");

    if (isEmailEmpty) {
      setLoginError("Email is required");
      return;
    }

    if (isEmailInvalid) {
      setLoginError("Enter a valid email");
      return;
    }

    if (isPasswordEmpty) {
      setLoginError("Password is required");
      return;
    }

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

      const storage = keepLoggedIn ? localStorage : sessionStorage;

      localStorage.clear();
      sessionStorage.clear();

      storage.setItem("token", data.access);
      storage.setItem("refresh", data.refresh);
      storage.setItem("role", "CUSTOMER");

      window.location.href = "/customer/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed";

      setLoginError(
        message.includes("Invalid") || message.includes("401")
          ? "Incorrect email or password"
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) {
      setLoginError(
        "Google sign-in did not return a credential. Please try again.",
      );
      return;
    }

    setIsGoogleLoading(true);
    setLoginError("");

    try {
      const data = await apiRequest<{
        access: string;
        refresh: string;
      }>("/auth/login/google/", {
        method: "POST",
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const storage = keepLoggedIn ? localStorage : sessionStorage;

      localStorage.clear();
      sessionStorage.clear();

      storage.setItem("token", data.access);
      storage.setItem("refresh", data.refresh);
      storage.setItem("role", "CUSTOMER");

      window.location.href = "/customer/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google login failed";

      setLoginError(
        `Google login failed: ${message}. Please try again.`,
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="customer-login-form">
      <div className="login-logo">
        <img src={logo} alt="Pawdigree logo" />
      </div>

      <h1>Welcome back!</h1>
      <p className="login-subtitle">
        Login to continue your Pawdigree journey.
      </p>

      {loginError && (
        <div className="login-error" role="alert">
          {loginError}
        </div>
      )}

      <form onSubmit={handleLogin} noValidate>
        <div className="form-group">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onBlur={() =>
              setTouched((previous) => ({
                ...previous,
                email: true,
              }))
            }
            aria-invalid={showEmailError}
            aria-describedby={
              showEmailError ? "login-email-error" : undefined
            }
          />

          {showEmailError && (
            <p id="login-email-error" className="field-error">
              {isEmailEmpty
                ? "Email is required"
                : "Enter a valid email"}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>

          <div className="password-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() =>
                setTouched((previous) => ({
                  ...previous,
                  password: true,
                }))
              }
              aria-invalid={showPasswordError}
              aria-describedby={
                showPasswordError
                  ? "login-password-error"
                  : undefined
              }
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {showPasswordError && (
            <p id="login-password-error" className="field-error">
              Password is required
            </p>
          )}
        </div>

        <div className="login-options">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
            />
            <span>Keep me logged in</span>
          </label>

          <a href="/forgot-password">Forgot password?</a>
        </div>

        <button
          type="submit"
          className="btn-primary full"
          disabled={isSubmitting || isGoogleLoading}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="login-divider">
        <span>OR</span>
      </div>

      <div className="google-login-button">
        {isGoogleLoading ? (
          <button
            type="button"
            className="btn-outline full"
            disabled
          >
            Connecting to Google...
          </button>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              setLoginError(
                "Google sign-in was cancelled or failed. Please try again.",
              )
            }
            text="signin_with"
            theme="outline"
            shape="pill"
            width="100%"
          />
        )}
      </div>

      <p className="login-register-link">
        Don't have an account? <a href="/register">Sign up</a>
      </p>

     <p className="login-terms">
          By continuing you agree to Pawdigree's{" "}
        <a href="https://pawdigree-frontend.onrender.com/terms" target="_blank" rel="noopener noreferrer">
           <strong>T&Cs</strong>
        </a>{" "}
            and{" "}
        <a href="https://pawdigree-frontend.onrender.com/privacy" target="_blank" rel="noopener noreferrer">
           <strong>Privacy Policy</strong>
        </a>
      </p>
    </div>
  );
}

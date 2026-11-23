import { useState } from "react";
import type { FormEvent } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import "./CustomerLoginForm.css";
import { apiRequest } from "../../services/api";
import {
  clearAuthSession,
  saveAuthSession,
} from "../../services/auth/authStorage";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getPostLoginPath } from "../../services/auth/authRedirect";

export default function CustomerLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const postLoginPath = getPostLoginPath(location.state, "CUSTOMER");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isEmailEmpty = !identifier.trim();
  const isEmailInvalid = !isEmailEmpty && !emailRegex.test(identifier.trim());
  const isPasswordEmpty = !password;

  const showEmailError = touched.email && (isEmailEmpty || isEmailInvalid);
  const showPasswordError = touched.password && isPasswordEmpty;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({ email: true, password: true });
    setLoginError("");

    if (isEmailEmpty || isEmailInvalid || isPasswordEmpty) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiRequest<{
        access?: string;
        refresh?: string;
        verification_required?: boolean;
        verification_token?: string;
        email?: string;
        masked_email?: string;
        expires_in?: number;
        resend_available_in?: number;
      }>("/auth/login/customer/", {
        method: "POST",
        body: JSON.stringify({
          email: identifier.trim(),
          password,
        }),
      });

      if (data.verification_required) {
        if (!data.verification_token) {
          throw new Error(
            "The verification response was incomplete. Please try logging in again.",
          );
        }
        clearAuthSession();
        sessionStorage.setItem(
          "pawdigree_email_verification",
          JSON.stringify({
            verificationToken: data.verification_token,
            email: data.masked_email ?? data.email ?? identifier.trim(),
            role: "CUSTOMER",
            redirectTo: postLoginPath,
            expiresAt: Date.now() + (data.expires_in ?? 600) * 1000,
            resendAt: Date.now() + (data.resend_available_in ?? 60) * 1000,
          }),
        );
        navigate("/verify-email");
        return;
      }

      if (!data.access || !data.refresh) {
        throw new Error("The login response was incomplete. Please try again.");
      }

      saveAuthSession({
        access: data.access,
        refresh: data.refresh,
        role: "CUSTOMER",
      });

      navigate(postLoginPath, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";

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

      saveAuthSession({
        access: data.access,
        refresh: data.refresh,
        role: "CUSTOMER",
      });

      navigate(postLoginPath, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google login failed";

      setLoginError(`Google login failed: ${message}. Please try again.`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="customer-login-form">
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
            aria-describedby={showEmailError ? "login-email-error" : undefined}
          />

          {showEmailError && (
            <p id="login-email-error" className="field-error">
              {isEmailEmpty ? "Email is required" : "Enter a valid email"}
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
                showPasswordError ? "login-password-error" : undefined
              }
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {showPasswordError && (
            <p id="login-password-error" className="field-error">
              Password is required
            </p>
          )}
        </div>

        <div className="login-options">
          <Link to="/forgot-password">Forgot password?</Link>
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

      {isGoogleLoading ? (
        <button type="button" className="btn-outline full" disabled>
          Connecting to Google...
        </button>
      ) : (
        <div className="google-login-button">
          <span className="google-login-visual" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            Sign in with Google
          </span>

          {/* Google's real button: invisible, stretched over the pill, takes the click */}
          <div className="google-login-overlay">
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
              width="400"
            />
          </div>
        </div>
      )}

      <p className="login-register-link">
        Don't have an account?{" "}
        <Link to="/registration" state={location.state}>
          Sign up
        </Link>
      </p>

      <p className="login-terms">
        By continuing you agree to Pawdigree's{" "}
        <a
          href="https://pawdigree-frontend.onrender.com/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>T&Cs</strong>
        </a>{" "}
        and{" "}
        <a
          href="https://pawdigree-frontend.onrender.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>Privacy Policy</strong>
        </a>
      </p>
    </div>
  );
}

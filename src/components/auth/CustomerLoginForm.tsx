import { useState } from "react";
import { Eye, EyeOff, Smartphone } from "lucide-react";
import "./CustomerLoginForm.css";
import { apiRequest } from "../../services/api";
import logo from "../../assets/logos/icon-logo.svg";

export default function CustomerLoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isEmailEmpty = !identifier.trim();
  const isEmailInvalid = !isEmailEmpty && !emailRegex.test(identifier.trim());
  const isPasswordEmpty = !password;

  const showEmailError = touched.email && (isEmailEmpty || isEmailInvalid);
  const showPasswordError = touched.password && isPasswordEmpty;

  const handleLogin = async (e: React.FormEvent) => {
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
      const data = await apiRequest<{ access: string; refresh: string }>(
        "/auth/login/customer/",
        {
          method: "POST",
          body: JSON.stringify({ email: identifier.trim(), password }),
        },
      );
      const storage = keepLoggedIn ? localStorage : sessionStorage;
      localStorage.clear();
      sessionStorage.clear();
      storage.setItem("token", data.access);
      storage.setItem("refresh", data.refresh);
      storage.setItem("role", "CUSTOMER");
      window.location.href = "/";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setLoginError(
        msg.includes("Invalid") || msg.includes("401")
          ? "Incorrect email or password"
          : msg,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // [MOCK] Pure mock Google login - no Client ID, no library, no error
  const handleMockGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setLoginError("");
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const storage = keepLoggedIn ? localStorage : sessionStorage;
    localStorage.clear();
    sessionStorage.clear();
    // Mock user data
    storage.setItem("token", "mock_google_token_12345");
    storage.setItem("refresh", "mock_refresh_12345");
    storage.setItem("role", "CUSTOMER");
    storage.setItem("user_email", "mock.user@gmail.com");
    storage.setItem("user_name", "Mock Google User");
    storage.setItem("user_picture", "https://i.pravatar.cc/150?u=mock");

    console.log("[MOCK] Google login success - remove this when backend ready");
    setIsGoogleLoading(false);
    window.location.href = "/";
  };

  return (
    <div className="login-card-wrapper">
      <div className="logo-header">
        <img src={logo} alt="Pawdigree" className="paw-logo-img" />
      </div>

      <form className="form-content" onSubmit={handleLogin} noValidate>
        <h2 className="welcome">Welcome back</h2>
        <p className="subtitle">Enter your details to log in.</p>

        {loginError && (
          <p className="err main-err" role="alert">
            {loginError}
          </p>
        )}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (loginError) setLoginError("");
            }}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="name@email.com"
            className={showEmailError ? "has-error" : ""}
          />
          {showEmailError && (
            <span className="err">
              {isEmailEmpty ? "Email is required" : "Enter a valid email"}
            </span>
          )}
        </div>

        <div className="field">
          <label>Password</label>
          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (loginError) setLoginError("");
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••••••"
              className={showPasswordError || loginError ? "has-error" : ""}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {showPasswordError && (
            <span className="err">Password is required</span>
          )}
        </div>

        <div className="form-row">
          <label className="check">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
            />
            Keep me logged in
          </label>
          <a href="/reset-password" className="forgot">
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

        <div className="or-divider">
          <span>OR</span>
        </div>

        {/* [MOCK] Google button with icon - fully functional mock */}
        <button
          type="button"
          className="btn-outline full btn-with-icon"
          onClick={handleMockGoogleLogin}
          disabled={isGoogleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isGoogleLoading ? "Connecting..." : "Log in with Google"}
        </button>

        <div className="or-divider small-margin">
          <span>OR</span>
        </div>

        {/* Phone button with lucide icon */}
        <button
          type="button"
          className="btn-outline full btn-with-icon"
          onClick={() => (window.location.href = "/login/phone")}
        >
          <Smartphone size={18} />
          Log in with phone code
        </button>

        <p className="terms-bottom">
          By continuing you agree to Pawdigree's <a href="/terms">T&Cs</a> and{" "}
          <a href="/privacy">Privacy Policy</a>
        </p>
      </form>
    </div>
  );
}

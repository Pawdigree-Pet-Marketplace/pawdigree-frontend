import { useState, useRef, useEffect } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import "./CustomerLoginPage.css";
import logo from "../assets/logos/icon-logo.svg";

type Step = "welcome" | "password" | "phone";

export default function CustomerLoginPage() {
  useEffect(() => {
    document.title = "Customer Login - Pawdigree";
  }, []);

  const [step, setStep] = useState<Step>("welcome");
  const [identifier, setIdentifier] = useState("amina@email.com");
  const [isEditing, setIsEditing] = useState(false);
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [emailInput, setEmailInput] = useState("amina@email.com");
  const [phoneInput, setPhoneInput] = useState("+256 772 123 456");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [otp, setOtp] = useState<string[]>(["4", "8", "2", "", "", ""]);
  const [timer, setTimer] = useState(42);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "phone" || timer === 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const getDisplayName = () => {
    if (identifier.includes("@")) {
      const name = identifier.split("@")[0].split(/[._]/)[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "there";
  };

  const validateIdentifier = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Email or phone is required";
    const isPhoneLike = /^[+0-9\s()-]+$/.test(trimmed) && /\d/.test(trimmed);
    if (isPhoneLike) {
      const phone = parsePhoneNumberFromString(trimmed, "UG");
      if (!phone || !phone.isValid()) {
        return "Enter a valid phone number (e.g. +256 772 123 456)";
      }
      return "";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed))
      return "Enter a valid email (e.g. name@email.com)";
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { identifier?: string; password?: string } = {};
    newErrors.identifier = validateIdentifier(identifier);
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "At least 6 characters";

    if (newErrors.identifier || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    const storage = keepLoggedIn ? localStorage : sessionStorage;
    storage.setItem("token", "fake-jwt-token");
    storage.setItem("role", "CUSTOMER");
    window.location.href = "/";
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const currentEditingValue = isPhoneMode ? phoneInput : emailInput;
  const isCurrentInvalid = !!validateIdentifier(currentEditingValue);

  return (
    <div className="login-page">
      <div className="top-bar">
        <button className="back-btn" onClick={handleBack} aria-label="Go back">
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
              <button className="btn-primary" onClick={handleWelcomeLogin}>
                Login
              </button>
              <button
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
                  }}
                >
                  {isPhoneMode ? "(or email)" : "(or phone)"}
                </button>
              </label>
              <div className="email-row">
                {isEditing ? (
                  <input
                    value={isPhoneMode ? phoneInput : emailInput}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      if (isPhoneMode) {
                        setPhoneInput(newVal);
                      } else {
                        setEmailInput(newVal);
                      }
                      const err = validateIdentifier(newVal);
                      setErrors((prev) => ({
                        ...prev,
                        identifier: err || undefined,
                      }));
                    }}
                    placeholder={
                      isPhoneMode ? "+256 772 123 456" : "name@email.com"
                    }
                    className={errors.identifier ? "has-error" : ""}
                  />
                ) : (
                  <input value={identifier} readOnly />
                )}
                <button
                  type="button"
                  className="change-btn"
                  disabled={isEditing && isCurrentInvalid}
                  style={{
                    opacity: isEditing && isCurrentInvalid ? 0.4 : 1,
                    cursor:
                      isEditing && isCurrentInvalid ? "not-allowed" : "pointer",
                  }}
                  onClick={() => {
                    if (isEditing) {
                      const val = isPhoneMode ? phoneInput : emailInput;
                      const err = validateIdentifier(val);
                      if (err) {
                        setErrors({ identifier: err });
                        return;
                      }
                      setIdentifier(val.trim());
                      setErrors({});
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
              <label>Password</label>
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className={errors.password ? "has-error" : ""}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                />{" "}
                Keep me logged in
              </label>
              <a href="/reset-password" className="forgot">
                Forgot password?
              </a>
            </div>
            <button type="submit" className="btn-primary full">
              Login
            </button>
            <div className="divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="btn-outline full"
              onClick={() => {
                setStep("phone");
                setTimer(60);
              }}
            >
              Log in with phone code
            </button>
            <p className="bottom-link">
              Don't have an account? <a href="/registration">Create account</a>
            </p>
          </form>
        )}
        {step === "phone" && (
          <div className="verify-content">
            <div className="verify-box">
              <h3>Verify phone</h3>
              <p>Enter the 6-digit code sent to {identifier}</p>
              <div className="otp-row">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    maxLength={1}
                    className={d ? "filled" : ""}
                  />
                ))}
              </div>
              <button
                type="button"
                className="resend"
                disabled={timer > 0}
                onClick={() => setTimer(60)}
              >
                {timer > 0
                  ? `Resend code in 0:${timer.toString().padStart(2, "0")}`
                  : "Resend code"}
              </button>
            </div>
            <button
              className="btn-primary full"
              onClick={() => {
                if (otp.join("").length === 6) {
                  localStorage.setItem("token", "fake-jwt-token");
                  window.location.href = "/";
                }
              }}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { apiRequest } from "../services/api";
import logo from "../assets/logos/icon-logo.svg";
import "./Customer/CustomerLoginPage.css";
import "./VerifyEmailPage.css";

type VerificationState = {
  verificationToken: string;
  email: string;
  role: "CUSTOMER" | "VENDOR";
  keepLoggedIn: boolean;
  expiresAt: number;
  resendAt: number;
};

type AuthTokens = { access?: string; refresh?: string };

function readVerificationState(): VerificationState | null {
  try {
    const value = sessionStorage.getItem("pawdigree_email_verification");
    if (!value) return null;
    const parsed = JSON.parse(value) as VerificationState;
    if (!parsed.verificationToken || !["CUSTOMER", "VENDOR"].includes(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loginPath(role?: string) {
  return role === "VENDOR" ? "/vendor/login" : "/login";
}

export default function VerifyEmailPage() {
  const [verification, setVerification] = useState(readVerificationState);
  const [loginRole, setLoginRole] = useState(() => readVerificationState()?.role);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    document.title = "Verify your email - Pawdigree";
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isExpired = Boolean(verification && now > 0 && verification.expiresAt <= now);

  useEffect(() => {
    if (isExpired) sessionStorage.removeItem("pawdigree_email_verification");
  }, [isExpired]);

  const activeVerification = isExpired ? null : verification;
  const secondsToResend = activeVerification
    ? Math.max(0, Math.ceil((activeVerification.resendAt - now) / 1000))
    : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verification || isSubmitting) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError("");
    setNotice("");
    setIsSubmitting(true);
    try {
      const tokens = await apiRequest<AuthTokens>("/auth/verify-email/", {
        method: "POST",
        body: JSON.stringify({ verification_token: verification.verificationToken, code }),
      });
      if (!tokens.access || !tokens.refresh) {
        throw new Error("Verification succeeded, but the login response did not include both access and refresh tokens.");
      }
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("token");
        storage.removeItem("refresh");
        storage.removeItem("role");
      }
      const storage = verification.keepLoggedIn ? localStorage : sessionStorage;
      storage.setItem("token", tokens.access);
      storage.setItem("refresh", tokens.refresh);
      storage.setItem("role", verification.role);
      sessionStorage.removeItem("pawdigree_email_verification");
      window.location.href = verification.role === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't verify that code. Please try again.";
      if (/expired.*token|token.*expired|invalid.*token/i.test(message)) {
        sessionStorage.removeItem("pawdigree_email_verification");
        setLoginRole(verification.role);
        setLoginRole(verification.role);
        setVerification(null);
        setError("This verification session has expired. Please log in again.");
      } else {
        setError(/code|invalid|incorrect/i.test(message) ? "That code is incorrect or has expired. Check it and try again." : message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!verification || secondsToResend > 0 || isResending) return;
    setError("");
    setNotice("");
    setIsResending(true);
    try {
      await apiRequest("/auth/verify-email/resend/", {
        method: "POST",
        body: JSON.stringify({ verification_token: verification.verificationToken }),
      });
      const resendAt = Date.now() + 60_000;
      const updated = { ...verification, resendAt };
      sessionStorage.setItem("pawdigree_email_verification", JSON.stringify(updated));
      setVerification(updated);
      setNotice("A new verification code has been sent.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't resend your code.";
      const retry = message.match(/retry_after\D*(\d+)/i);
      if (retry) {
        const updated = { ...verification, resendAt: Date.now() + Number(retry[1]) * 1000 };
        sessionStorage.setItem("pawdigree_email_verification", JSON.stringify(updated));
        setVerification(updated);
      } else if (/expired.*token|token.*expired|invalid.*token/i.test(message)) {
        sessionStorage.removeItem("pawdigree_email_verification");
        setLoginRole(verification.role);
        setVerification(null);
        setError("This verification session has expired. Please log in again.");
      } else {
        setError(message);
      }
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="login-page verify-email-page">
      <header className="top-bar verify-email-topbar">
        <button type="button" className="back-btn" onClick={() => {
          if (verification) window.location.href = loginPath(verification.role);
          else window.location.href = loginPath(loginRole);
        }} aria-label="Back to login"><ArrowLeft size={20} /></button>
        <span className="top-bar-title">Verify your email</span>
        <div className="spacer" />
      </header>
      <section className="login-card verify-email-card">
        <div className="login-logo"><img src={logo} alt="Pawdigree logo" className="real-logo" /></div>
        <div className="verify-email-icon" aria-hidden="true"><MailCheck size={26} /></div>
        <p className="role-eyebrow">EMAIL VERIFICATION</p>
        <h1>Check your inbox</h1>
        {activeVerification ? (
          <>
            <p className="verify-email-description">Enter the 6-digit code we sent to <strong>{activeVerification.email}</strong>.</p>
            {error && <div id="verification-error" className="login-error" role="alert">{error}</div>}
            {notice && <div className="verify-email-notice" role="status">{notice}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <label className="verify-email-label" htmlFor="verification-code">Verification code</label>
              <input id="verification-code" className="verify-email-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} aria-describedby={error ? "verification-error" : undefined} />
              <button type="submit" className="btn-primary full verify-email-submit" disabled={isSubmitting}>{isSubmitting ? "Verifying..." : "Verify email and log in"}</button>
            </form>
            <p className="verify-email-resend">Didn't receive a code?</p>
            <button type="button" className="resend" onClick={handleResend} disabled={isResending || secondsToResend > 0}>
              {isResending ? "Sending..." : secondsToResend > 0 ? `Resend code in ${secondsToResend}s` : "Resend code"}
            </button>
            <p className="verify-email-expiry">This code expires in 10 minutes.</p>
          </>
        ) : (
          <>
            <p className="verify-email-description">{error || (isExpired ? "This verification session has expired. Please log in again." : "Your verification session is unavailable. Please log in again to request a new code.")}</p>
            <a className="btn-primary full verify-email-login-link" href={loginPath(loginRole)}>Back to login</a>
          </>
        )}
      </section>
    </main>
  );
}

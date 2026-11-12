import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Mail, CheckCircle } from "lucide-react";
import "./ForgotPasswordPage.css";
import { apiRequest } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Forgot Password - Pawdigree";
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("/auth/password-reset/request/", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });

      setMessage(
        "If an account exists for this email, password reset instructions will be sent.",
      );
    } catch {
      setError(
        "We couldn't process your request right now. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="forgot-password-page">
      <section className="forgot-password-card">
        <BackButton label="Back to login" onClick={() => navigate("/login")} />

        {message ? (
          <div className="forgot-success" role="status">
            <CheckCircle size={42} />
            <h1>Check your email</h1>
            <p>{message}</p>
            <button
              type="button"
              className="forgot-primary-button"
              onClick={() => {
                navigate("/login");
              }}
            >
              Return to login
            </button>
          </div>
        ) : (
          <>
            <div className="forgot-mail-icon">
              <Mail size={28} />
            </div>

            <h1>Forgot your password?</h1>

            <p className="forgot-description">
              Don't worry! Enter the email address associated with your
              Pawdigree account and we'll help you reset your password.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="forgot-email">Email address</label>

              <input
                id="forgot-email"
                type="email"
                name="email"
                placeholder="name@email.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "forgot-error" : undefined}
              />

              {error && (
                <p id="forgot-error" className="forgot-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="forgot-primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending request..." : "Send reset link"}
              </button>
            </form>

            <p className="forgot-login-link">
              Remembered your password? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

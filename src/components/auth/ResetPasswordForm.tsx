
import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { apiRequest } from "../../services/api";
import "./ResetPasswordForm.css";
import pawdigreeLogo from "../../assets/logo.png";

const ResetPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const conditions = useMemo(
    () => [
      { ok: newPassword.length >= 8, text: "At least 8 characters" },
      { ok: /[A-Z]/.test(newPassword), text: "At least one uppercase letter" },
      { ok: /[a-z]/.test(newPassword), text: "At least one lowercase letter" },
      { ok: /[0-9]/.test(newPassword), text: "At least one number" },
      {
        ok: /[^A-Za-z0-9]/.test(newPassword),
        text: "At least one symbol (!@#$...)",
      },
    ],
    [newPassword],
  );

  const allConditionsMet =
    conditions.every((condition) => condition.ok) && newPassword.length > 0;

  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const isButtonDisabled =
    isLoading || !allConditionsMet || !passwordsMatch || !email.trim();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!allConditionsMet) {
      setError("Please make sure your password meets all the requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Your passwords do not match.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const token = params.get("token");

    if (!uid || !token) {
      setError("This reset link is invalid or expired. Please request a new one.");
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest(
        `/auth/password-reset/confirm/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`,
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            token,
            new_password: newPassword,
          }),
        },
      );

      setSuccess(
        "Your password has been reset successfully. You can now log in with your new password.",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password. The link may have expired.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="reset-password-page">
      <section className="reset-password-card">
        <img
  src={pawdigreeLogo}
  alt="Pawdigree logo"
  className="reset-password-logo"
/>

        {success ? (
          <>
            <h1>Password Updated!</h1>
            <p className="reset-password-description">
              You're all set. Use your new password to access your account.
            </p>

            <div className="reset-password-success" role="status">
              <Check size={32} strokeWidth={2.5} />
              <p>{success}</p>
              <a className="reset-password-login-link" href="/login">
                Go to Login
              </a>
            </div>
          </>
        ) : (
          <>
            <h1>Reset Your Password</h1>
            <p className="reset-password-description">
              Choose a strong new password to get back to your Pawdigree account.
            </p>

            <form
              className="reset-password-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {error && (
                <p className="reset-password-error" role="alert">
                  {error}
                </p>
              )}

              <div className="reset-password-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  className="reset-password-input"
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your account email"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="reset-password-group">
                <label htmlFor="new-password">New Password</label>

                <div className="reset-password-input-wrapper">
                  <input
                    className={`reset-password-input ${
                      newPassword
                        ? allConditionsMet
                          ? "password-valid"
                          : "password-invalid"
                        : ""
                    }`}
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                  />

                  <button
                    className="reset-password-toggle"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {newPassword && (
                  <ul className="reset-password-requirements">
                    {conditions.map((condition) => (
                      <li
                        className={`reset-password-requirement ${
                          condition.ok ? "met" : ""
                        }`}
                        key={condition.text}
                      >
                        {condition.ok ? (
                          <Check size={14} />
                        ) : (
                          <X size={14} />
                        )}
                        <span>{condition.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="reset-password-group">
                <label htmlFor="confirm-password">Confirm New Password</label>

                <div className="reset-password-input-wrapper">
                  <input
                    className={`reset-password-input ${
                      confirmPassword
                        ? passwordsMatch
                          ? "password-valid"
                          : "password-invalid"
                        : ""
                    }`}
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    disabled={!allConditionsMet}
                    required
                  />

                  <button
                    className="reset-password-toggle"
                    type="button"
                    aria-label={
                      showConfirm
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    disabled={!allConditionsMet}
                    onClick={() => setShowConfirm((visible) => !visible)}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {confirmPassword && (
                  <p
                    className={`reset-password-match ${
                      passwordsMatch ? "valid" : ""
                    }`}
                  >
                    {passwordsMatch
                      ? "✓ Passwords match"
                      : "✕ Passwords do not match"}
                  </p>
                )}
              </div>

              <button
                className="reset-password-button"
                type="submit"
                disabled={isButtonDisabled}
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>

            <p className="reset-password-footer">
              Remembered your password?
              <br />
              <a href="/login">Back to Login</a>
            </p>
          </>
        )}
      </section>
    </main>
  );
};

export default ResetPasswordForm;

import { useState, useMemo } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const conditions = useMemo(() => {
    return [
      { ok: newPassword.length >= 8, text: "At least 8 characters" },
      { ok: /[A-Z]/.test(newPassword), text: "At least one uppercase letter" },
      { ok: /[a-z]/.test(newPassword), text: "At least one lowercase letter" },
      { ok: /[0-9]/.test(newPassword), text: "At least one number" },
      {
        // FIXED: replaced complex escaped regex with simple symbol check (no useless escapes)
        ok: /[^A-Za-z0-9]/.test(newPassword),
        text: "At least one symbol (!@#$...)",
      },
    ];
  }, [newPassword]);

  const allConditionsMet =
    conditions.every((c) => c.ok) && newPassword.length > 0;
  const unmetConditions = conditions.filter((c) => !c.ok);
  const passwordsMatch = newPassword !== "" && newPassword === confirmPassword;
  const isButtonDisabled = isLoading || !allConditionsMet || !passwordsMatch;

  const getPasswordBorder = () => {
    if (!newPassword)
      return { borderColor: "", outline: "none", boxShadow: "none" };
    if (!allConditionsMet)
      return { borderColor: "#e5484d", outline: "none", boxShadow: "none" };
    return { borderColor: "#30a46c", outline: "none", boxShadow: "none" };
  };

  const getConfirmBorder = () => {
    if (!confirmPassword)
      return { borderColor: "", outline: "none", boxShadow: "none" };
    if (newPassword !== confirmPassword)
      return { borderColor: "#e5484d", outline: "none", boxShadow: "none" };
    return { borderColor: "#30a46c", outline: "none", boxShadow: "none" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!allConditionsMet) {
      setError("Please fix your password to meet all requirements");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      console.log("Reset token:", token);

      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(
        "Password reset successfully! You can now log in with your new password.",
      );
    } catch (err: unknown) {
      // FIXED: no `any`
      const message =
        err instanceof Error
          ? err.message
          : "Failed to reset password. Link may be expired.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <style>{`
      .registration-form input:focus {
          box-shadow: none!important;
          outline: none!important;
        }
        @media (max-width: 480px) {
        .registration-card {
            width: 92%!important;
            margin: 20px auto!important;
            padding: 20px!important;
          }
        .registration-form input {
            font-size: 16px!important;
            height: 48px!important;
          }
        .registration-form input::placeholder {
            font-size: 14px!important;
          }
        .register-button {
            height: 48px!important;
            font-size: 15px!important;
          }
        .registration-header h1 {
            font-size: 22px!important;
          }
        }
      `}</style>

      <div className="registration-card">
        <div className="registration-header">
          <h1>{success ? "Success!" : "Reset Password"}</h1>
          <p>
            {success
              ? "Your password has been updated"
              : "Enter your new password below"}
          </p>
        </div>

        {success ? (
          <div className="registration-form">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
                background: "rgba(48,164,108,0.08)",
                borderRadius: "12px",
                border: "1px solid #30a46c",
                color: "#30a46c",
                textAlign: "center",
              }}
            >
              <Check size={32} strokeWidth={2.5} />
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>
                {success}
              </p>
            </div>
            <a
              href="/login"
              className="register-button"
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                marginTop: "16px",
                borderRadius: "999px",
              }}
            >
              Go to Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="registration-form">
            {error && <p className="form-error">{error}</p>}

            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  style={{
                    ...getPasswordBorder(),
                    transition: "border-color 0.2s ease",
                  }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "var(--charcoal)",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>

              {newPassword && !allConditionsMet && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {unmetConditions.map((item) => (
                    <div
                      key={item.text}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.78rem",
                        color: "#8a8f98",
                      }}
                    >
                      <X size={14} />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {allConditionsMet && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "10px",
                    fontSize: "0.82rem",
                    color: "#30a46c",
                    fontWeight: 500,
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Strong password</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={!allConditionsMet}
                  style={{
                    ...getConfirmBorder(),
                    transition: "border-color 0.2s ease",
                    opacity: allConditionsMet ? 1 : 0.6,
                    cursor: allConditionsMet ? "text" : "not-allowed",
                    backgroundColor: allConditionsMet ? "" : "#f5f5f5",
                  }}
                />
                <span
                  onClick={() =>
                    allConditionsMet && setShowConfirm(!showConfirm)
                  }
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: allConditionsMet ? "pointer" : "not-allowed",
                    color: "var(--charcoal)",
                    opacity: allConditionsMet ? 1 : 0.4,
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>

              {confirmPassword &&
                newPassword !== confirmPassword &&
                allConditionsMet && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "6px",
                      fontSize: "0.78rem",
                      color: "#e5484d",
                    }}
                  >
                    <X size={14} />
                    <span>Passwords do not match</span>
                  </div>
                )}
              {passwordsMatch && allConditionsMet && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "6px",
                    fontSize: "0.82rem",
                    color: "#30a46c",
                    fontWeight: 500,
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Passwords match</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="register-button"
              disabled={isButtonDisabled}
              style={{
                opacity: isButtonDisabled ? 0.5 : 1,
                cursor: isButtonDisabled ? "not-allowed" : "pointer",
                borderRadius: "999px",
              }}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <p className="login-link">
              Remembered your password? <a href="/login">Back to Login</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

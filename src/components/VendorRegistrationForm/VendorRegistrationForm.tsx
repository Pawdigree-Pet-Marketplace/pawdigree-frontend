import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./VendorRegistrationForm.css";

type FormData = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function VendorRegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(field: keyof FormData, value: string) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    setMessage("");
  }

  function fieldClass(field: keyof FormData): string {
    if (errors[field]) return "input-error";

    if (formData[field].trim().length > 0) {
      return "input-valid";
    }

    return "";
  }

  function validateForm(): FormErrors {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required.";
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required.";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "The passwords do not match.";
    }

    return newErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setMessage("Please correct the highlighted fields before continuing.");
      return;
    }

    if (!acceptTerms) {
      setMessage("Please accept the terms and conditions to continue.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/register/vendor/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const backendErrors: FormErrors = {};

        for (const field of [
          "username",
          "first_name",
          "last_name",
          "email",
          "phone",
          "password",
        ] as const) {
          const errorValue = result[field];

          if (Array.isArray(errorValue)) {
            backendErrors[field] = errorValue.join(" ");
          } else if (typeof errorValue === "string") {
            backendErrors[field] = errorValue;
          }
        }

        setErrors((previous) => ({
          ...previous,
          ...backendErrors,
        }));

        setMessage(
          result.detail ||
            result.message ||
            "Registration failed. Please check your information."
        );

        return;
      }

      setMessage(
        "Your vendor account was created successfully! You can now proceed to the next step."
      );
    } catch {
      setMessage(
        "Could not connect to the server. Make sure the Django backend is running and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="vendor-registration-form">
      <div className="form-container">
        <header className="page-heading">
          <h1>Become a Pawdigree Vendor</h1>
          <p>
            Join Uganda's pet marketplace and connect with customers
            looking for trusted pet products and services. Create your
            vendor account to get started.
          </p>
        </header>

        <div className="form-card">
          <form onSubmit={handleSubmit} noValidate>
            <section className="form-section">
              <h2>Vendor Account Information</h2>
              <p className="section-description">
                Create the login details you will use to access your
                Pawdigree vendor account. You can register your businesses
                separately after creating your account.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="username">
                    Username <span className="required-mark">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    className={fieldClass("username")}
                    placeholder="Choose a username"
                    aria-invalid={Boolean(errors.username)}
                    onChange={(event) =>
                      handleChange("username", event.target.value)
                    }
                  />
                  {errors.username && (
                    <p className="field-message error-message">
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span className="required-mark">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    className={fieldClass("email")}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                  />
                  {errors.email && (
                    <p className="field-message error-message">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="first_name">
                    First Name <span className="required-mark">*</span>
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={formData.first_name}
                    className={fieldClass("first_name")}
                    placeholder="Enter first name"
                    aria-invalid={Boolean(errors.first_name)}
                    onChange={(event) =>
                      handleChange("first_name", event.target.value)
                    }
                  />
                  {errors.first_name && (
                    <p className="field-message error-message">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">
                    Last Name <span className="required-mark">*</span>
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={formData.last_name}
                    className={fieldClass("last_name")}
                    placeholder="Enter last name"
                    aria-invalid={Boolean(errors.last_name)}
                    onChange={(event) =>
                      handleChange("last_name", event.target.value)
                    }
                  />
                  {errors.last_name && (
                    <p className="field-message error-message">
                      {errors.last_name}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    Phone Number <span className="required-mark">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    className={fieldClass("phone")}
                    placeholder="e.g. +256 7XX XXX XXX"
                    aria-invalid={Boolean(errors.phone)}
                    onChange={(event) =>
                      handleChange("phone", event.target.value)
                    }
                  />
                  {errors.phone && (
                    <p className="field-message error-message">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    Password <span className="required-mark">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.password}
                      className={fieldClass("password")}
                      placeholder="At least 8 characters"
                      aria-invalid={Boolean(errors.password)}
                      onChange={(event) =>
                        handleChange("password", event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="field-message error-message">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="confirmPassword">
                    Confirm Password <span className="required-mark">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      className={fieldClass("confirmPassword")}
                      placeholder="Enter your password again"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      onChange={(event) =>
                        handleChange("confirmPassword", event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword((previous) => !previous)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirmation password"
                          : "Show confirmation password"
                      }
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="field-message error-message">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="form-section">
              <h2>Review and Submit</h2>
              <p className="section-description">
                Check your details before creating your vendor account.
                You can register one or more businesses separately.
              </p>

              <label className="terms-option">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                />
                <span>
                  I confirm that the information I have provided is accurate
                  and agree to the Pawdigree terms and conditions.
                </span>
              </label>

              {message && (
                <div
                  className={`form-message ${
                    message.toLowerCase().includes("successfully")
                      ? "form-message--success"
                      : "form-message--error"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Creating Your Account..." : "Create Vendor Account"}
              </button>
            </section>
          </form>
        </div>
      </div>
    </main>
  );
}

export default VendorRegistrationForm;
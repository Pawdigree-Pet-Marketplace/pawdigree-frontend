
import { useEffect, useRef, useState } from "react";
import type { FocusEvent, FormEvent } from "react";
import {
  isValidPhoneNumber,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

import "../../App.css";
import "./CustomerRegistrationForm.css";
import { apiRequest } from "../../services/api";
import CountryFlag from "../CountryFlag/CountryFlag";

type CountryOption = {
  country: string;
  iso_code: string;
  dial_code: string;
};

type RegistrationField =
  | "first_name"
  | "last_name"
  | "username"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword";

type FormData = Record<RegistrationField, string>;

const initialFormData: FormData = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const steps = [
  {
    title: "Your details",
    description: "Enter your name and choose a username.",
  },
  {
    title: "Contact details",
    description: "Provide your email address and phone number.",
  },
  {
    title: "Review and create account",
    description:
      "Review your information, make any necessary changes, and secure your account.",
  },
];

const stepFields: RegistrationField[][] = [
  ["first_name", "last_name", "username"],
  ["email", "phone"],
  ["password", "confirmPassword"],
];

const fieldOrder: RegistrationField[] = [
  "first_name",
  "last_name",
  "username",
  "email",
  "phone",
  "password",
  "confirmPassword",
];

export default function CustomerRegistrationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [country, setCountry] = useState<CountryCode>("UG");
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countryLoadError, setCountryLoadError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<
    Partial<Record<RegistrationField, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const [success, setSuccess] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest<CountryOption[]>("/country-codes/")
      .then((items) => {
        if (cancelled) return;

        setCountries(items);

        const initialCountry =
          items.find((item) => item.iso_code === "UG") ?? items[0];

        if (initialCountry) {
          setCountry(initialCountry.iso_code as CountryCode);
        } else {
          setCountryLoadError(
            "Country calling codes are currently unavailable.",
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCountryLoadError(
            "Unable to load country calling codes. Please refresh the page and try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cleanedPhone = formData.phone.replace(/[\s()-]/g, "");
  const trimmedUsername = formData.username.trim();

  const firstNameForUsername = formData.first_name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const lastNameForUsername = formData.last_name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const usernameSuggestions =
    firstNameForUsername && lastNameForUsername
      ? [
          `@${firstNameForUsername}${lastNameForUsername}`,
          `@${firstNameForUsername}.${lastNameForUsername}`,
          `@${lastNameForUsername}${firstNameForUsername}`,
        ].filter(
          (suggestion, index, all) =>
            all.indexOf(suggestion) === index,
        )
      : [];

  const phoneIsValid = () => {
    try {
      return cleanedPhone.startsWith("+")
        ? isValidPhoneNumber(cleanedPhone)
        : isValidPhoneNumber(cleanedPhone, country);
    } catch {
      return false;
    }
  };

  const errors: Record<RegistrationField, string | undefined> = {
    first_name: !formData.first_name.trim()
      ? "Please enter your first name."
      : undefined,

    last_name: !formData.last_name.trim()
      ? "Please enter your last name."
      : undefined,

    username: !trimmedUsername
      ? "Please choose a username."
      : !trimmedUsername.startsWith("@")
        ? "Your username must start with @."
        : trimmedUsername.length < 2
          ? "Enter a username after @."
          : undefined,

    email: !formData.email.trim()
      ? "Please enter your email address."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ? "Please enter a valid email address."
        : undefined,

    phone: !formData.phone.trim()
      ? "Please enter your phone number."
      : !phoneIsValid()
        ? "Enter a valid phone number for the selected country."
        : undefined,

    password: !formData.password
      ? "Please create a password."
      : formData.password.length < 8
        ? "Your password must contain at least 8 characters."
        : !/[A-Z]/.test(formData.password)
          ? "Include at least one uppercase letter."
          : !/[a-z]/.test(formData.password)
            ? "Include at least one lowercase letter."
            : !/[0-9]/.test(formData.password)
              ? "Include at least one number."
              : !/[^A-Za-z0-9]/.test(formData.password)
                ? "Include at least one special character."
                : undefined,

    confirmPassword: !formData.confirmPassword
      ? "Please confirm your password."
      : formData.password !== formData.confirmPassword
        ? "The passwords do not match."
        : undefined,
  };

  const isFormValid = fieldOrder.every((field) => !errors[field]);
  const updateField = (name: RegistrationField, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setSuccess("");
    setApiError("");
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const name = event.target.name as RegistrationField;
    setTouched((current) => ({ ...current, [name]: true }));
  };

  const showError = (field: RegistrationField) =>
    (touched[field] || submitted) && Boolean(errors[field]);

  const validateFields = (fields: RegistrationField[]) => {
    setTouched((current) => ({
      ...current,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    }));

    const firstInvalid = fields.find((field) => errors[field]);

    if (firstInvalid) {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)
          ?.focus();
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateFields(stepFields[step])) return;

    setApiError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleBack = () => {
    setApiError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const editSection = (targetStep: number) => {
    setApiError("");
    setSubmitted(false);
    setStep(targetStep);
    setTouched({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < steps.length - 1) {
      handleNext();
      return;
    }

    setSubmitted(true);
    setSuccess("");
    setApiError("");

    if (!validateFields(fieldOrder)) {
      const invalidStep = stepFields.findIndex((fields) =>
        fields.some((field) => errors[field]),
      );

      if (invalidStep >= 0) setStep(invalidStep);
      return;
    }

    let parsedPhone;

    try {
      parsedPhone = cleanedPhone.startsWith("+")
        ? parsePhoneNumber(cleanedPhone)
        : parsePhoneNumber(cleanedPhone, country);
    } catch {
      parsedPhone = undefined;
    }

    if (!parsedPhone) {
      setApiError("Please enter a valid phone number.");
      setStep(1);
      return;
    }

    const registrationData = {
      username: trimmedUsername,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: parsedPhone.number,
      password: formData.password,
    };

    setIsSubmitting(true);

    try {
      await apiRequest("/auth/register/customer/", {
        method: "POST",
        body: JSON.stringify(registrationData),
      });

      setSuccess(
        "Your Pawdigree account has been created successfully. Please check your inbox for your email verification instructions.",
      );

      setFormData(initialFormData);
      setTouched({});
      setSubmitted(false);
      setStep(0);
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "We couldn't complete your registration. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayPhone = () => {
    if (!cleanedPhone) return "Not provided";

    try {
      return cleanedPhone.startsWith("+")
        ? parsePhoneNumber(cleanedPhone)?.formatInternational() ??
            cleanedPhone
        : parsePhoneNumber(cleanedPhone, country)?.formatInternational() ??
            cleanedPhone;
    } catch {
      return cleanedPhone;
    }
  };

  return (
    <section className="registration-card">
      <div className="registration-header">
        <h1>Create your account</h1>
        <p>Join Pawdigree to connect with trusted pet services.</p>
      </div>

      {!success && (
        <div
          className="registration-progress"
          aria-label={`Step ${step + 1} of ${steps.length}`}
        >
          <div className="registration-progress-track">
            <div
              className="registration-progress-fill"
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
          <p className="registration-step-count">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="registration-step-title">{steps[step].title}</h2>
          <p className="registration-step-description">
            {steps[step].description}
          </p>
        </div>
      )}

      {success && (
        <div className="form-success" role="status">
          <h2>Registration successful</h2>
          <p>{success}</p>
          <p>
            <Link to="/customer-login">Continue to log in</Link>
          </p>
        </div>
      )}

      {apiError && (
        <p className="field-error" role="alert">
          {apiError}
        </p>
      )}

      {!success && (
        <form
          className="registration-form"
          onSubmit={handleSubmit}
          ref={formRef}
          noValidate
        >
          {step === 0 && (
            <div className="registration-step-fields">
              <div className="form-group">
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  autoComplete="given-name"
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  onBlur={handleBlur}
                  className={showError("first_name") ? "has-error" : undefined}
                  aria-invalid={showError("first_name")}
                />
                {showError("first_name") && (
                  <p className="field-error" role="alert">
                    {errors.first_name}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  autoComplete="family-name"
                  placeholder="Enter your last name"
                  value={formData.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  onBlur={handleBlur}
                  className={showError("last_name") ? "has-error" : undefined}
                  aria-invalid={showError("last_name")}
                />
                {showError("last_name") && (
                  <p className="field-error" role="alert">
                    {errors.last_name}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="@yourusername"
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  onBlur={handleBlur}
                  className={showError("username") ? "has-error" : undefined}
                  aria-invalid={showError("username")}
                />

                {showError("username") ? (
                  <p className="field-error" role="alert">
                    {errors.username}
                  </p>
                ) : (
                  <small>
                    Choose a suggestion or create a username starting with @.
                  </small>
                )}

                {usernameSuggestions.length > 0 && (
                  <div className="username-suggestions">
                    <small>Username suggestions</small>
                    <div className="username-suggestion-list">
                      {usernameSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="username-suggestion"
                          aria-pressed={formData.username === suggestion}
                          onClick={() => {
                            updateField("username", suggestion);
                            setTouched((current) => ({
                              ...current,
                              username: true,
                            }));
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="registration-step-fields">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  onBlur={handleBlur}
                  className={showError("email") ? "has-error" : undefined}
                  aria-invalid={showError("email")}
                />
                {showError("email") && (
                  <p className="field-error" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone number</label>
                <div className="registration-phone-row">
                  <div className="registration-country-select">
                    <CountryFlag
                      countryCode={country}
                      className="country-flag"
                    />
                    <select
                      id="country"
                      value={country}
                      disabled={countriesLoading || countries.length === 0}
                      onChange={(e) => {
                        setCountry(e.target.value as CountryCode);
                        setTouched((current) => ({
                          ...current,
                          phone: true,
                        }));
                        setApiError("");
                      }}
                      aria-label="Country calling code"
                    >
                      {countries.map((item) => (
                        <option key={item.iso_code} value={item.iso_code}>
                          {item.country} ({item.dial_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    onBlur={handleBlur}
                    className={showError("phone") ? "has-error" : undefined}
                    aria-invalid={showError("phone")}
                  />
                </div>

                {countryLoadError && (
                  <p className="field-error" role="alert">
                    {countryLoadError}
                  </p>
                )}

                {showError("phone") ? (
                  <p className="field-error" role="alert">
                    {errors.phone}
                  </p>
                ) : (
                  <small>
                    Enter your local number or include + and the full country
                    code.
                  </small>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="registration-step-fields">
              <div className="registration-review">
                <section className="registration-review-section">
                  <div className="registration-review-heading">
                    <h3>Personal details</h3>
                    <button
                      type="button"
                      className="registration-edit-button"
                      onClick={() => editSection(0)}
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="registration-review-list">
                    <div>
                      <dt>First name</dt>
                      <dd>{formData.first_name.trim()}</dd>
                    </div>
                    <div>
                      <dt>Last name</dt>
                      <dd>{formData.last_name.trim()}</dd>
                    </div>
                    <div>
                      <dt>Username</dt>
                      <dd>{trimmedUsername}</dd>
                    </div>
                  </dl>
                </section>

                <section className="registration-review-section">
                  <div className="registration-review-heading">
                    <h3>Contact details</h3>
                    <button
                      type="button"
                      className="registration-edit-button"
                      onClick={() => editSection(1)}
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="registration-review-list">
                    <div>
                      <dt>Email address</dt>
                      <dd>{formData.email.trim()}</dd>
                    </div>
                    <div>
                      <dt>Phone number</dt>
                      <dd>{displayPhone()}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    onBlur={handleBlur}
                    className={showError("password") ? "has-error" : undefined}
                    aria-invalid={showError("password")}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>

                {showError("password") ? (
                  <p className="field-error" role="alert">
                    {errors.password}
                  </p>
                ) : (
                  <small>
                    Use at least 8 characters, including uppercase and
                    lowercase letters, a number, and a special character.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="password-field">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    onBlur={handleBlur}
                    className={
                      showError("confirmPassword") ? "has-error" : undefined
                    }
                    aria-invalid={showError("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>

                {showError("confirmPassword") && (
                  <p className="field-error" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="registration-step-actions">
            {step > 0 && (
              <button
                type="button"
                className="registration-back-button"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                className="register-button"
                onClick={handleNext}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className={`register-button ${isFormValid ? "register-button-ready" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            )}
          </div>
        </form>
      )}

      {!success && (
        <p className="login-link">
          Already have an account? <Link to="/customer-login">Log in</Link>
        </p>
      )}
    </section>
  );
}

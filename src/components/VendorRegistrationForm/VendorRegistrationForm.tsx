import { useEffect, useMemo, useRef, useState } from "react";
import type { FocusEvent, FormEvent } from "react";
import {
  isValidPhoneNumber,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import "../../App.css";
import "./VendorRegistrationForm.css";
import { apiRequest } from "../../services/api";
import { saveAuthSession } from "../../services/auth/authStorage";
import CountryFlag from "../CountryFlag/CountryFlag";
import GoogleSignInButton from "../GoogleSignInButton/GoogleSignInButton";

/* TODO: Confirm with the backend team that this endpoint
   creates vendor accounts using Google authentication. */
const GOOGLE_AUTH_PATH = "/auth/google/vendor/";

type CountryOption = {
  country: string;
  iso_code: string;
  dial_code: string;
};

type RegistrationField =
  | "first_name"
  | "last_name"
  | "email"
  | "username"
  | "phone"
  | "password"
  | "confirmPassword";

type FormData = Record<RegistrationField, string>;

type AuthTokens = {
  access?: string;
  refresh?: string;
};

const initialFormData: FormData = {
  first_name: "",
  last_name: "",
  email: "",
  username: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const fieldOrder: RegistrationField[] = [
  "first_name",
  "last_name",
  "email",
  "username",
  "phone",
  "password",
  "confirmPassword",
];

const firstStepFields: RegistrationField[] = [
  "first_name",
  "last_name",
  "email",
  "username",
  "phone",
];

/* Phone input: digits only, and the first digit can never be 0.
   A pasted international number such as +256772123456 keeps its "+". */
function sanitizePhone(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  return trimmed.replace(/\D/g, "").replace(/^0+/, "");
}

/* ---------- Username ---------- */

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;

/* Standard username rules: lowercase letters, numbers, dots and underscores.
   Must start with a letter and cannot end with a dot or underscore. */
function sanitizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, USERNAME_MAX);
}

function usernameError(value: string): string | undefined {
  if (!value) return "Please choose a username.";
  if (value.length < USERNAME_MIN)
    return `Your username must be at least ${USERNAME_MIN} characters.`;
  if (!/^[a-z]/.test(value)) return "Your username must start with a letter.";
  if (/[._]$/.test(value))
    return "Your username cannot end with a dot or underscore.";
  if (/[._]{2,}/.test(value))
    return "Avoid using dots or underscores back to back.";
  return undefined;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^[^a-z]+/, "");
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/* Builds a few username ideas from the person's names and/or email.
   Suffixed ideas use a number so they are far less likely to be taken. */
function buildUsernameSuggestions(
  firstName: string,
  lastName: string,
  email: string,
): string[] {
  const first = slug(firstName);
  const last = slug(lastName);
  const emailName = slug(email.split("@")[0] ?? "");

  const bases: string[] = [];

  if (first && last) {
    bases.push(
      `${first}${last}`,
      `${first}.${last}`,
      `${first}_${last}`,
      `${first[0]}${last}`,
      `${first}${last[0]}`,
    );
  } else if (first || last) {
    bases.push(first || last);
  }

  if (emailName) bases.push(emailName);

  const unique = Array.from(new Set(bases)).filter(
    (base) => base.length >= USERNAME_MIN,
  );

  const withNumber = (base: string, index: number) => {
    const random = seededRandom(hashString(base) + index);
    const digits = index % 2 === 0 ? 2 : 3;
    const number = Math.floor(
      random * (digits === 2 ? 90 : 900) + (digits === 2 ? 10 : 100),
    );
    const trimmedBase = base.slice(0, USERNAME_MAX - String(number).length);
    return `${trimmedBase}${number}`;
  };

  const plain = unique.slice(0, 2);
  const numbered = unique.map((base, index) => withNumber(base, index));

  const all = [...plain, ...numbered]
    .map((item) => item.slice(0, USERNAME_MAX))
    .filter((item) => !usernameError(item));

  return Array.from(new Set(all)).slice(0, 4);
}

function Required() {
  return (
    <span className="vreg-required-star" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export default function VendorRegistrationForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [step, setStep] = useState<1 | 2>(1);

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [country, setCountry] = useState<CountryCode>("UG");
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countryLoadError, setCountryLoadError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<
    Partial<Record<RegistrationField, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const [success, setSuccess] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usernameCheck, setUsernameCheck] = useState<{
    value: string;
    result: "available" | "taken" | "unknown";
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  /* Load country calling codes */

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

  /* Live username availability check (waits until typing pauses).
     TODO: Ask the backend team for this endpoint. It should answer
     GET /auth/username-available/?username=abc with { "available": true }.
     Until it exists the request fails quietly and the final registration
     call still rejects a taken username. */

  useEffect(() => {
    const value = formData.username;

    if (usernameError(value)) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      apiRequest<{ available: boolean }>(
        `/auth/username-available/?username=${encodeURIComponent(value)}`,
      )
        .then((result) => {
          if (!cancelled) {
            setUsernameCheck({
              value,
              result: result.available ? "available" : "taken",
            });
          }
        })
        .catch(() => {
          if (!cancelled) setUsernameCheck({ value, result: "unknown" });
        });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.username]);

  /* The status is worked out from the latest check result instead of being
     stored, so no state is set while the effect runs. */

  const usernameStatus: "idle" | "checking" | "available" | "taken" =
    usernameError(formData.username)
      ? "idle"
      : usernameCheck?.value !== formData.username
        ? "checking"
        : usernameCheck.result === "unknown"
          ? "idle"
          : usernameCheck.result;

  /* Phone number validation */

  const cleanedPhone = formData.phone.replace(/[\s()-]/g, "");

  const phoneIsValid = () => {
    try {
      return cleanedPhone.startsWith("+")
        ? isValidPhoneNumber(cleanedPhone)
        : isValidPhoneNumber(cleanedPhone, country);
    } catch {
      return false;
    }
  };

  /* Form validation */

  const errors: Record<RegistrationField, string | undefined> = {
    first_name: !formData.first_name.trim()
      ? "Please enter your first name."
      : undefined,

    last_name: !formData.last_name.trim()
      ? "Please enter your last name."
      : undefined,

    email: !formData.email.trim()
      ? "Please enter your email address."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ? "Please enter a valid email address."
        : undefined,

    username:
      usernameError(formData.username) ??
      (usernameStatus === "taken"
        ? "That username is already taken. Pick a suggestion or try another."
        : undefined),

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

  /* Username suggestions. They only appear once both names and a valid email
     have been entered, and they disappear as soon as a username has been
     picked or typed. */

  const suggestions = useMemo(() => {
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formData.email.trim(),
    );

    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !emailLooksValid
    ) {
      return [];
    }

    return buildUsernameSuggestions(
      formData.first_name,
      formData.last_name,
      formData.email,
    );
  }, [formData.first_name, formData.last_name, formData.email]);

  const showSuggestions = suggestions.length > 0 && !formData.username;

  /* Update individual form fields */

  const updateField = (name: RegistrationField, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setSuccess("");
    setApiError("");
  };

  /* Track fields that the user has interacted with */

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const name = event.target.name as RegistrationField;
    setTouched((current) => ({ ...current, [name]: true }));
  };

  const showError = (field: RegistrationField) =>
    (touched[field] ||
      submitted ||
      (field === "username" && usernameStatus === "taken")) &&
    Boolean(errors[field]);

  const pickSuggestion = (value: string) => {
    updateField("username", value);
    setTouched((current) => ({ ...current, username: true }));
  };

  /* Move from step one to step two */

  const handleNextStep = () => {
    setSubmitted(true);

    const firstInvalid = firstStepFields.find((field) => errors[field]);

    if (firstInvalid) {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)
          ?.focus();
      });

      return;
    }

    setSubmitted(false);
    setStep(2);
    setApiError("");
  };

  /* Return to step one without losing entered information */

  const handlePreviousStep = () => {
    setStep(1);
    setSubmitted(false);
    setApiError("");
  };

  /* Google sign-up */

  const handleGoogleCredential = async (credential: string) => {
    setApiError("");

    try {
      const tokens = await apiRequest<AuthTokens>(GOOGLE_AUTH_PATH, {
        method: "POST",
        body: JSON.stringify({ credential }),
      });

      if (!tokens.access || !tokens.refresh) {
        setApiError("Google sign-up didn't complete. Please try again.");
        return;
      }

      saveAuthSession({
        access: tokens.access,
        refresh: tokens.refresh,
        role: "VENDOR",
      });

      navigate("/vendor/dashboard", { replace: true });
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Google sign-up failed. Please try again.",
      );
    }
  };

  /* Final registration submission */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    /* Pressing Enter on step one should behave like "Continue" */
    if (step === 1) {
      handleNextStep();
      return;
    }

    setSubmitted(true);
    setSuccess("");
    setApiError("");

    const firstInvalid = fieldOrder.find((field) => errors[field]);

    if (firstInvalid) {
      /* If the problem is on step one, take the person back to it */
      if (firstStepFields.includes(firstInvalid)) {
        setStep(1);
      }

      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)
          ?.focus();
      });

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
      return;
    }

    const registrationData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      username: formData.username,
      email: formData.email.trim(),
      phone: parsedPhone.number,
      password: formData.password,
    };

    setIsSubmitting(true);

    try {
      await apiRequest("/auth/register/vendor/", {
        method: "POST",
        body: JSON.stringify(registrationData),
      });

      setSuccess(
        "Your Pawdigree vendor account has been created successfully. Please check your inbox for your email verification instructions.",
      );

      setFormData(initialFormData);
      setTouched({});
      setSubmitted(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setUsernameCheck(null);
      setStep(1);
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

  const hasBackLink = step === 2 && !success;

  return (
    <section
      className={`vreg-card ${hasBackLink ? "vreg-card--has-back" : ""}`}
    >
      {hasBackLink && (
        <button
          type="button"
          className="vreg-back"
          onClick={handlePreviousStep}
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      )}

      <div className="vreg-header">
        <h1>Create your vendor account</h1>
      </div>

      {success && (
        <div className="vreg-success" role="status">
          <h2>Vendor registration successful</h2>
          <p>{success}</p>
          <p>
            <Link to="/vendor/login">Continue to log in</Link>
          </p>
        </div>
      )}

      {apiError && (
        <p className="vreg-error vreg-error--banner" role="alert">
          {apiError}
        </p>
      )}

      {!success && (
        <form
          className="vreg-form"
          onSubmit={handleSubmit}
          ref={formRef}
          noValidate
        >
          {/* Step indicator */}

          <div className="vreg-step-indicator">
            <span>Step {step} of 2</span>

            <div
              className="vreg-progress"
              aria-label={`Registration progress: step ${step} of 2`}
            >
              <span className={step >= 1 ? "active" : ""} />
              <span className={step >= 2 ? "active" : ""} />
            </div>

            <p className="vreg-required-note">
              Fields marked <span className="vreg-required-star">*</span> are
              required.
            </p>
          </div>

          <div className="vreg-grid">
            {/* STEP ONE: Personal and contact information */}

            {step === 1 && (
              <>
                <div className="vreg-group">
                  <label htmlFor="first_name">
                    First name
                    <Required />
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    autoComplete="given-name"
                    placeholder="Enter your first name"
                    value={formData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    onBlur={handleBlur}
                    className={
                      showError("first_name") ? "has-error" : undefined
                    }
                    aria-invalid={showError("first_name")}
                    aria-required="true"
                  />

                  {showError("first_name") && (
                    <p className="vreg-error" role="alert">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div className="vreg-group">
                  <label htmlFor="last_name">
                    Last name
                    <Required />
                  </label>

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
                    aria-required="true"
                  />

                  {showError("last_name") && (
                    <p className="vreg-error" role="alert">
                      {errors.last_name}
                    </p>
                  )}
                </div>

                <div className="vreg-group vreg-group--full">
                  <label htmlFor="email">
                    Email address
                    <Required />
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@yourbusiness.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    onBlur={handleBlur}
                    className={showError("email") ? "has-error" : undefined}
                    aria-invalid={showError("email")}
                    aria-required="true"
                  />

                  {showError("email") && (
                    <p className="vreg-error" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Username: label and field on one line. Suggestions appear
                    once the names and email above are filled in. */}
                <div className="vreg-group vreg-group--full vreg-group--inline">
                  <label htmlFor="username">
                    Username
                    <Required />
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={USERNAME_MAX}
                    placeholder="username123"
                    value={formData.username}
                    onChange={(e) =>
                      updateField("username", sanitizeUsername(e.target.value))
                    }
                    onBlur={handleBlur}
                    className={showError("username") ? "has-error" : undefined}
                    aria-invalid={showError("username")}
                    aria-required="true"
                  />

                  {showError("username") ? (
                    <p className="vreg-error" role="alert">
                      {errors.username}
                    </p>
                  ) : usernameStatus === "available" ? (
                    <p className="vreg-ok" role="status">
                      Great, this username is available.
                    </p>
                  ) : usernameStatus === "checking" ? (
                    <small>Checking availability...</small>
                  ) : null}

                  {showSuggestions && (
                    <div
                      className="vreg-suggestions"
                      role="group"
                      aria-label="Username suggestions"
                    >
                      <span className="vreg-suggestions-label">
                        Suggestions:
                      </span>

                      {suggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="vreg-chip"
                          onClick={() => pickSuggestion(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="vreg-group vreg-group--full">
                  <label htmlFor="phone">
                    Phone number
                    <Required />
                  </label>

                  <div className="vreg-phone-row">
                    <div className="vreg-country-select">
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
                            {item.dial_code} {item.country}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        updateField("phone", sanitizePhone(e.target.value))
                      }
                      onBlur={handleBlur}
                      className={showError("phone") ? "has-error" : undefined}
                      aria-invalid={showError("phone")}
                      aria-required="true"
                    />
                  </div>

                  {countryLoadError && (
                    <p className="vreg-error" role="alert">
                      {countryLoadError}
                    </p>
                  )}

                  {showError("phone") && (
                    <p className="vreg-error" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* STEP TWO: Password information (side by side) */}

            {step === 2 && (
              <>
                <div className="vreg-group">
                  <label htmlFor="password">
                    Password
                    <Required />
                  </label>

                  <div className="vreg-password-field">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      onBlur={handleBlur}
                      className={
                        showError("password") ? "has-error" : undefined
                      }
                      aria-invalid={showError("password")}
                      aria-required="true"
                    />

                    <button
                      type="button"
                      className="vreg-password-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {showError("password") && (
                    <p className="vreg-error" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="vreg-group">
                  <label htmlFor="confirmPassword">
                    Confirm password
                    <Required />
                  </label>

                  <div className="vreg-password-field">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                      onBlur={handleBlur}
                      className={
                        showError("confirmPassword") ? "has-error" : undefined
                      }
                      aria-invalid={showError("confirmPassword")}
                      aria-required="true"
                    />

                    <button
                      type="button"
                      className="vreg-password-toggle"
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
                    <p className="vreg-error" role="alert">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Step navigation and submission */}

          <div className="vreg-actions">
            {step === 1 ? (
              <button
                key="continue"
                type="button"
                className="vreg-submit vreg-submit--ready"
                onClick={handleNextStep}
              >
                Continue
              </button>
            ) : (
              <>
                <button
                  key="submit"
                  type="submit"
                  className={`vreg-submit ${
                    isFormValid ? "vreg-submit--ready" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Creating account..."
                    : "Create vendor account"}
                </button>

                <div className="vreg-divider" aria-hidden="true">
                  <span>OR</span>
                </div>

                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  onError={() =>
                    setApiError("Google sign-up failed. Please try again.")
                  }
                />
              </>
            )}
          </div>
        </form>
      )}

      {!success && (
        <p className="vreg-login-link">
          Already a vendor? <Link to="/vendor/login">Sign in</Link>
        </p>
      )}
    </section>
  );
}

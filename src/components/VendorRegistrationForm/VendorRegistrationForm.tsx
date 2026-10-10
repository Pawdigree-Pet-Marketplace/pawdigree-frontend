import { useState, type ChangeEvent, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./VendorRegistrationForm.css";

/* ==========================================
   TYPES
========================================== */

type FormData = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  businessName: string;
  businessType: string;
  description: string;
  address: string;
  district: string;
  businessPhone: string;
  businessEmail: string;

  registeredBusinessName: string;
  registrationNumber: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

/* ==========================================
   BUSINESS CATEGORIES
========================================== */

const vendorCategories = [
  "Pets for sale",
  "Pet adoption",
  "Veterinary services",
  "Pet grooming",
  "Pet boarding",
  "Pet merchandise",
];

/* ==========================================
   VENDOR REGISTRATION COMPONENT
========================================== */

function VendorRegistrationForm() {
  /* Account and business form values */

  const [formData, setFormData] = useState<FormData>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    businessName: "",
    businessType: "",
    description: "",
    address: "",
    district: "",
    businessPhone: "",
    businessEmail: "",

    registeredBusinessName: "",
    registrationNumber: "",
  });

  /* Selected business categories */

  const [categories, setCategories] = useState<string[]>([]);

  /* Terms and conditions checkbox */

  const [acceptTerms, setAcceptTerms] = useState(false);

  /* Validation errors */

  const [errors, setErrors] = useState<FormErrors>({});

  /* General success and error messages */

  const [message, setMessage] = useState("");

  /* Submission loading state */

  const [isLoading, setIsLoading] = useState(false);

  /* Password visibility states */

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* ==========================================
     HANDLE TEXT INPUT CHANGES
  ========================================== */

  function handleChange(
    field: keyof FormData,
    value: string
  ) {
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

  /* ==========================================
     HANDLE CATEGORY CHECKBOXES
  ========================================== */

  function handleCategoryChange(category: string) {
    setCategories((previous) =>
      previous.includes(category)
        ? previous.filter((item) => item !== category)
        : [...previous, category]
    );

    setMessage("");
  }

  /* ==========================================
     VALIDATE FORM FIELDS
  ========================================== */

  function validateForm(): FormErrors {
    const newErrors: FormErrors = {};

    /* Account details */

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
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must contain at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "The passwords do not match.";
    }

    /* Business details */

    if (!formData.businessName.trim()) {
      newErrors.businessName =
        "Business name is required.";
    }

    if (!formData.businessType) {
      newErrors.businessType =
        "Please select a business type.";
    }

    if (!formData.description.trim()) {
      newErrors.description =
        "Please describe your business.";
    }

    if (!formData.address.trim()) {
      newErrors.address =
        "Business address is required.";
    }

    if (!formData.district.trim()) {
      newErrors.district = "District is required.";
    }

    /* Optional business email must still be valid if supplied */

    if (
      formData.businessEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.businessEmail
      )
    ) {
      newErrors.businessEmail =
        "Enter a valid business email address.";
    }

    return newErrors;
  }

  /* ==========================================
     INPUT VALIDATION STYLING
  ========================================== */

  function fieldClass(field: keyof FormData): string {
    if (errors[field]) {
      return "input-error";
    }

    if (String(formData[field]).trim().length > 0) {
      return "input-valid";
    }

    return "";
  }

  /* ==========================================
     SUBMIT REGISTRATION FORM
  ========================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setMessage(
        "Please correct the highlighted fields before continuing."
      );
      return;
    }

    if (categories.length === 0) {
      setMessage(
        "Please select at least one business category."
      );
      return;
    }

    if (!acceptTerms) {
      setMessage(
        "Please accept the terms and conditions to continue."
      );
      return;
    }

    setIsLoading(true);

    try {
      /*
       * This endpoint currently accepts only these six fields.
       * The extra business information, selected categories,
       * and uploaded files are not saved by this request.
       */

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
        const backendMessage =
          result.detail ||
          result.message ||
          "Registration failed. Please check your information.";

        if (result && typeof result === "object") {
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

          if (Object.keys(backendErrors).length > 0) {
            setErrors((previous) => ({
              ...previous,
              ...backendErrors,
            }));
          }
        }

        setMessage(
          typeof backendMessage === "string"
            ? backendMessage
            : "Registration failed. Please check your information."
        );

        return;
      }

      setMessage(
        "Your vendor account was created successfully. Please note that your business details, categories, and uploaded documents have not been submitted to the current backend endpoint. Vendor verification may require a separate submission."
      );
    } catch {
      setMessage(
        "Could not connect to the server. Make sure the Django backend is running and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  /* ==========================================
     RENDER FORM
  ========================================== */

  return (
    <main className="vendor-registration-form">
      <div className="form-container">
        {/* Page introduction */}

        <header className="page-heading">
          <h1>Become a Pawdigree Vendor</h1>
          <p>
            Join Uganda's pet marketplace and connect with
            customers looking for trusted pet products and
            services. Complete the form below to get started.
          </p>
        </header>

        {/* Registration form card */}

        <div className="form-card">
          <form onSubmit={handleSubmit} noValidate>
            {/* ======================================
                SECTION 1: ACCOUNT INFORMATION
            ====================================== */}

            <section className="form-section">
              <h2>1. Account Information</h2>
              <p className="section-description">
                Create the login details you will use to access
                your vendor account.
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
                    Email Address{" "}
                    <span className="required-mark">*</span>
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
                    First Name{" "}
                    <span className="required-mark">*</span>
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
                    Last Name{" "}
                    <span className="required-mark">*</span>
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
                    Phone Number{" "}
                    <span className="required-mark">*</span>
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

                {/* Password with show/hide button */}

                <div className="form-group">
                  <label htmlFor="password">
                    Password{" "}
                    <span className="required-mark">*</span>
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
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="field-message error-message">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm password with its own show/hide button */}

                <div className="form-group full-width">
                  <label htmlFor="confirmPassword">
                    Confirm Password{" "}
                    <span className="required-mark">*</span>
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      className={fieldClass("confirmPassword")}
                      placeholder="Enter your password again"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      onChange={(event) =>
                        handleChange(
                          "confirmPassword",
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) => !previous
                        )
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

            {/* ======================================
                SECTION 2: BUSINESS INFORMATION
            ====================================== */}

            <section className="form-section">
              <h2>2. Business Information</h2>
              <p className="section-description">
                Tell customers about your business and where
                they can find you.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="businessName">
                    Business Name{" "}
                    <span className="required-mark">*</span>
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    className={fieldClass("businessName")}
                    placeholder="Enter your business name"
                    aria-invalid={Boolean(errors.businessName)}
                    onChange={(event) =>
                      handleChange("businessName", event.target.value)
                    }
                  />
                  {errors.businessName && (
                    <p className="field-message error-message">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="businessType">
                    Business Type{" "}
                    <span className="required-mark">*</span>
                  </label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    className={fieldClass("businessType")}
                    aria-invalid={Boolean(errors.businessType)}
                    onChange={(event) =>
                      handleChange("businessType", event.target.value)
                    }
                  >
                    <option value="">Select business type</option>
                    <option value="individual">
                      Individual business
                    </option>
                    <option value="registered">
                      Registered business
                    </option>
                    <option value="partnership">Partnership</option>
                    <option value="organization">
                      Organization
                    </option>
                  </select>
                  {errors.businessType && (
                    <p className="field-message error-message">
                      {errors.businessType}
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">
                    Business Description{" "}
                    <span className="required-mark">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    className={fieldClass("description")}
                    placeholder="Describe your business, products, or services..."
                    aria-invalid={Boolean(errors.description)}
                    onChange={(event) =>
                      handleChange("description", event.target.value)
                    }
                  />
                  {errors.description && (
                    <p className="field-message error-message">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">
                    Business Address{" "}
                    <span className="required-mark">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    autoComplete="street-address"
                    value={formData.address}
                    className={fieldClass("address")}
                    placeholder="Enter your physical business address"
                    aria-invalid={Boolean(errors.address)}
                    onChange={(event) =>
                      handleChange("address", event.target.value)
                    }
                  />
                  {errors.address && (
                    <p className="field-message error-message">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="district">
                    District{" "}
                    <span className="required-mark">*</span>
                  </label>
                  <input
                    id="district"
                    type="text"
                    value={formData.district}
                    className={fieldClass("district")}
                    placeholder="e.g. Kampala"
                    aria-invalid={Boolean(errors.district)}
                    onChange={(event) =>
                      handleChange("district", event.target.value)
                    }
                  />
                  {errors.district && (
                    <p className="field-message error-message">
                      {errors.district}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="businessPhone">
                    Business Phone Number
                  </label>
                  <input
                    id="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    className={fieldClass("businessPhone")}
                    placeholder="Business contact number"
                    onChange={(event) =>
                      handleChange("businessPhone", event.target.value)
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="businessEmail">
                    Business Email Address
                  </label>
                  <input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    className={fieldClass("businessEmail")}
                    placeholder="business@example.com"
                    aria-invalid={Boolean(errors.businessEmail)}
                    onChange={(event) =>
                      handleChange("businessEmail", event.target.value)
                    }
                  />
                  {errors.businessEmail && (
                    <p className="field-message error-message">
                      {errors.businessEmail}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ======================================
                SECTION 3: BUSINESS CATEGORIES
            ====================================== */}

            <section className="form-section">
              <h2>3. Business Categories</h2>
              <p className="section-description">
                Select every category that applies to your
                business. You can choose more than one.
              </p>

              <div className="category-grid">
                {vendorCategories.map((category) => (
                  <label
                    className="category-option"
                    key={category}
                  >
                    <input
                      type="checkbox"
                      checked={categories.includes(category)}
                      onChange={() =>
                        handleCategoryChange(category)
                      }
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* ======================================
                SECTION 4: VERIFICATION INFORMATION
            ====================================== */}

            <section className="form-section">
              <h2>4. Business Verification</h2>
              <p className="section-description">
                Provide your business registration details where
                applicable. Uploaded files are selected in this
                form but are not yet sent to the current backend
                registration endpoint.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="registeredBusinessName">
                    Registered Business Name
                  </label>
                  <input
                    id="registeredBusinessName"
                    type="text"
                    value={formData.registeredBusinessName}
                    className={fieldClass("registeredBusinessName")}
                    placeholder="Name on registration documents"
                    onChange={(event) =>
                      handleChange(
                        "registeredBusinessName",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registrationNumber">
                    Business Registration Number
                  </label>
                  <input
                    id="registrationNumber"
                    type="text"
                    value={formData.registrationNumber}
                    className={fieldClass("registrationNumber")}
                    placeholder="Enter registration number"
                    onChange={(event) =>
                      handleChange(
                        "registrationNumber",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="registrationDocument">
                    Business Registration Document
                  </label>
                  <input
                    id="registrationDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <p className="helper-text">
                    Accepted file types: PDF, JPG, JPEG, and PNG.
                  </p>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="businessPhotos">
                    Business Photos
                  </label>
                  <input
                    id="businessPhotos"
                    type="file"
                    accept="image/*"
                    multiple
                  />
                  <p className="helper-text">
                    You can select more than one image. These
                    files are not uploaded by the current
                    registration request.
                  </p>
                </div>
              </div>
            </section>

            {/* ======================================
                SECTION 5: TERMS AND SUBMISSION
            ====================================== */}

            <section className="form-section">
              <h2>5. Review and Submit</h2>
              <p className="section-description">
                Review your information before creating your
                vendor account.
              </p>

              <label className="terms-option">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(
                    event: ChangeEvent<HTMLInputElement>
                  ) => setAcceptTerms(event.target.checked)}
                />
                <span>
                  I confirm that the information I have provided
                  is accurate and agree to the Pawdigree terms
                  and conditions.
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
                {isLoading
                  ? "Creating Your Account..."
                  : "Create Vendor Account"}
              </button>
            </section>
          </form>
        </div>
      </div>
    </main>
  );
}

export default VendorRegistrationForm;

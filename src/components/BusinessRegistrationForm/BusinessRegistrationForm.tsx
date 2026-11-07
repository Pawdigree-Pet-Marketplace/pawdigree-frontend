import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import CountryFlag from "../CountryFlag/CountryFlag";
import { Link, useNavigate } from "react-router-dom";
import { getSessionToken } from "../../services/auth/authStorage";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import "./BusinessRegistrationForm.css";
import API_BASE_URL from "../../services/api";

interface CountryOption {
  country: string;
  iso_code: string;
  dial_code: string;
}

interface DayHours {
  is_open: boolean;
  open: string;
  close: string;
}

type BusinessHours = Record<string, DayHours>;

type BusinessType = "" | "PRODUCT_SELLER" | "SERVICE_PROVIDER";

interface FormData {
  businessName: string;
  businessType: BusinessType;
  description: string;
  address: string;
  cityDistrict: string;
  businessPhone: string;
  businessEmail: string;
  agreeToTerms: boolean;
}

interface BusinessRegistrationResponse {
  id: string;
  name: string;
  business_type: BusinessType;
  description: string;
  contact: string;
  email: string;
  address: string;
  city_district: string;
  business_hours: BusinessHours;
}

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const initialBusinessHours: BusinessHours = {
  monday: { is_open: true, open: "09:00", close: "17:00" },
  tuesday: { is_open: true, open: "09:00", close: "17:00" },
  wednesday: { is_open: true, open: "09:00", close: "17:00" },
  thursday: { is_open: true, open: "09:00", close: "17:00" },
  friday: { is_open: true, open: "09:00", close: "17:00" },
  saturday: { is_open: true, open: "09:00", close: "17:00" },
  sunday: { is_open: false, open: "09:00", close: "17:00" },
};

const initialFormData: FormData = {
  businessName: "",
  businessType: "",
  description: "",
  address: "",
  cityDistrict: "",
  businessPhone: "",
  businessEmail: "",
  agreeToTerms: false,
};

function BusinessRegistrationForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("UG");
  const [loadingCountries, setLoadingCountries] = useState(true);

  const [businessHours, setBusinessHours] =
    useState<BusinessHours>(initialBusinessHours);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const stepLabels = [
    "Business Information",
    "Contact & Location",
    "Operating Hours",
  ];

  // Load available phone countries from the backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadCountries() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/country-codes/`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load phone country codes.");
        }

        const data = await response.json();

        const countryList: CountryOption[] = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [];

        setCountries(countryList);

        const defaultCountry =
          countryList.find((item) => item.iso_code === "UG") ?? countryList[0];

        if (defaultCountry) {
          setSelectedCountry(defaultCountry.iso_code as CountryCode);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Unable to load phone country codes:", error);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCountries(false);
        }
      }
    }

    loadCountries();

    return () => controller.abort();
  }, []);

  // Handle ordinary form fields and checkboxes.
  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = event.target;

    const checked =
      type === "checkbox" && "checked" in event.target
        ? event.target.checked
        : false;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => {
      const updated = { ...previous };
      delete updated[name];
      return updated;
    });
  }

  // Handle opening days and times.
  function handleHoursChange(
    day: string,
    field: keyof DayHours,
    value: string | boolean,
  ) {
    setBusinessHours((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [field]: value,
      },
    }));

    setErrors((previous) => {
      const updated = { ...previous };
      delete updated.businessHours;
      return updated;
    });
  }

  // Validate only the fields belonging to the current step.
  function validateForm(step: number = currentStep): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = "Business name is required.";
      }

      if (!formData.businessType) {
        newErrors.businessType = "Please select your business type.";
      }

      if (!formData.description.trim()) {
        newErrors.description = "Business description is required.";
      } else if (formData.description.trim().length > 500) {
        newErrors.description = "Description cannot exceed 500 characters.";
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = "Business address is required.";
      }

      if (!formData.cityDistrict.trim()) {
        newErrors.cityDistrict = "City or district is required.";
      }

      if (!formData.businessPhone.trim()) {
        newErrors.businessPhone = "Business phone number is required.";
      } else {
        const phoneInput = formData.businessPhone.trim();

        const phone = phoneInput.startsWith("+")
          ? parsePhoneNumberFromString(phoneInput)
          : parsePhoneNumberFromString(phoneInput, selectedCountry);

        if (!phone || !phone.isValid()) {
          newErrors.businessPhone =
            "Enter a valid phone number for the selected country.";
        }
      }

      if (!formData.businessEmail.trim()) {
        newErrors.businessEmail = "Business email is required.";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail.trim())
      ) {
        newErrors.businessEmail = "Enter a valid email address.";
      }
    }

    if (step === 3) {
      const invalidHours = weekdays.some((day) => {
        const hours = businessHours[day];

        if (!hours.is_open) {
          return false;
        }

        return !hours.open || !hours.close || hours.open >= hours.close;
      });

      if (invalidHours) {
        newErrors.businessHours =
          "For each open day, provide valid opening and closing times.";
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "You must agree to the terms and conditions.";
      }
    }

    setErrors((previous) => {
      const updated = { ...previous };

      const fieldsByStep: Record<number, string[]> = {
        1: ["businessName", "businessType", "description"],
        2: ["address", "cityDistrict", "businessPhone", "businessEmail"],
        3: ["businessHours", "agreeToTerms"],
      };

      fieldsByStep[step].forEach((field) => {
        delete updated[field];
      });

      return { ...updated, ...newErrors };
    });

    return Object.keys(newErrors).length === 0;
  }

  // Move to the next step after successful validation.
  function handleNextStep() {
    setMessage("");

    if (!validateForm(currentStep)) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((previous) => previous + 1);
    }
  }

  // Return to the previous step.
  function handlePreviousStep() {
    setMessage("");
    setCurrentStep((previous) => Math.max(1, previous - 1));
  }

  // Submit the completed business registration.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessageType("error");
      setMessage("Please correct the highlighted fields.");
      return;
    }

    const accessToken = getSessionToken();

    if (!accessToken) {
      setMessageType("error");
      setMessage(
        "Please log in before registering your business. Your login session may have expired.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const phoneInput = formData.businessPhone.trim();

      const phone = phoneInput.startsWith("+")
        ? parsePhoneNumberFromString(phoneInput)
        : parsePhoneNumberFromString(phoneInput, selectedCountry);

      if (!phone || !phone.isValid()) {
        throw new Error("Please enter a valid business phone number.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/businesses/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: formData.businessName.trim(),
            business_type: formData.businessType,
            description: formData.description.trim(),
            contact: phone.number,
            email: formData.businessEmail.trim(),
            address: formData.address.trim(),
            city_district: formData.cityDistrict.trim(),
            business_hours: businessHours,
          }),
        },
      );

      const responseData: BusinessRegistrationResponse = await response
        .json()
        .catch(() => ({}) as BusinessRegistrationResponse);

      if (response.status === 401) {
        throw new Error(
          "Your login session is invalid or expired. Please log in again.",
        );
      }

      if (!response.ok) {
        const details = Object.entries(responseData)
          .map(([field, value]) => {
            const text = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${field}: ${text}`;
          })
          .join(" ");

        throw new Error(
          details || "Business registration failed. Please try again.",
        );
      }

      const businessId = responseData.id;

      if (!businessId) {
        throw new Error(
          "Your business was registered, but its ID was not returned. Please contact support before registering again.",
        );
      }

      sessionStorage.setItem("onboardingBusinessId", businessId);
      sessionStorage.setItem("onboardingBusinessType", formData.businessType);

      navigate(`/vendor/documents/${businessId}`);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VendorLayout
      title="Register your business"
      description="Step 1 of 3 — Business information"
      businessName={formData.businessName || "Your store"}
      vendorWorkspace
    >
      <div className="vendor-page-content business-registration-page">
        <main className="business-registration-container">
          <header className="registration-heading">
            <span className="registration-brand">PAWDIGREE</span>

            <h1>Register Your Business</h1>

            <p>Tell us about your business to get started on Pawdigree.</p>
          </header>

          {/* Three-step progress indicator */}
          <div className="registration-progress">
            <div className="progress-heading">
              <span>
                Step {currentStep} of {totalSteps}
              </span>

              <span>
                {Math.round((currentStep / totalSteps) * 100)}% complete
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(currentStep / totalSteps) * 100}%`,
                }}
              />
            </div>

            <div className="progress-steps">
              {stepLabels.map((label, index) => {
                const stepNumber = index + 1;

                return (
                  <div
                    key={label}
                    className={`progress-step ${
                      currentStep === stepNumber
                        ? "active"
                        : currentStep > stepNumber
                          ? "completed"
                          : ""
                    }`}
                  >
                    <span className="progress-step-number">
                      {currentStep > stepNumber ? "✓" : stepNumber}
                    </span>

                    <span className="progress-step-label">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success and error messages */}
          {message && (
            <div
              className={`form-message ${messageType}`}
              role={messageType === "success" ? "status" : "alert"}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* STEP 1: Business information */}
            {currentStep === 1 && (
              <>
                <div className="form-group">
                  <label htmlFor="businessName">Business name</label>

                  <input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Enter your business name"
                    aria-invalid={Boolean(errors.businessName)}
                  />

                  {errors.businessName && (
                    <p className="field-error">{errors.businessName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="businessType">Business type</label>

                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.businessType)}
                    required
                  >
                    <option value="">Select your business type</option>
                    <option value="PRODUCT_SELLER">Product Seller</option>
                    <option value="SERVICE_PROVIDER">Service Provider</option>
                  </select>

                  <small>
                    Choose the type that best describes what your business
                    offers.
                  </small>

                  {errors.businessType && (
                    <p className="field-error">{errors.businessType}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Business description</label>

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Briefly describe your business and what you offer..."
                    maxLength={500}
                    rows={4}
                    aria-invalid={Boolean(errors.description)}
                  />

                  <small>{formData.description.length}/500 characters</small>

                  {errors.description && (
                    <p className="field-error">{errors.description}</p>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: Contact and location */}
            {currentStep === 2 && (
              <>
                <div className="form-group">
                  <label htmlFor="address">Business address</label>

                  <input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your business address"
                    aria-invalid={Boolean(errors.address)}
                  />

                  {errors.address && (
                    <p className="field-error">{errors.address}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="cityDistrict">City or district</label>

                  <input
                    id="cityDistrict"
                    name="cityDistrict"
                    value={formData.cityDistrict}
                    onChange={handleChange}
                    placeholder="e.g. Kampala"
                    aria-invalid={Boolean(errors.cityDistrict)}
                  />

                  {errors.cityDistrict && (
                    <p className="field-error">{errors.cityDistrict}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="businessPhone">Business phone</label>

                  <div className="business-phone-row">
                    <div className="business-country-select">
                      <CountryFlag countryCode={selectedCountry} />

                      <select
                        aria-label="Phone country"
                        value={selectedCountry}
                        disabled={loadingCountries || countries.length === 0}
                        onChange={(event) => {
                          setSelectedCountry(event.target.value as CountryCode);

                          setErrors((previous) => {
                            const updated = { ...previous };
                            delete updated.businessPhone;
                            return updated;
                          });
                        }}
                      >
                        {countries.map((item) => (
                          <option key={item.iso_code} value={item.iso_code}>
                            {item.country} ({item.dial_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      id="businessPhone"
                      name="businessPhone"
                      type="tel"
                      placeholder="+256..."
                      value={formData.businessPhone}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.businessPhone)}
                    />
                  </div>

                  {errors.businessPhone && (
                    <p className="field-error">{errors.businessPhone}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="businessEmail">Business email</label>

                  <input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="business@example.com"
                    aria-invalid={Boolean(errors.businessEmail)}
                  />

                  {errors.businessEmail && (
                    <p className="field-error">{errors.businessEmail}</p>
                  )}
                </div>
              </>
            )}

            {/* STEP 3: Operating hours and terms */}
            {currentStep === 3 && (
              <>
                <fieldset className="business-hours">
                  <legend>Business operating hours</legend>

                  <p className="hours-description">
                    Select the days your business is open and set your operating
                    times.
                  </p>

                  <div className="business-hours-grid">
                    {weekdays.map((day) => (
                      <div className="business-hours-card" key={day}>
                        <div className="business-hours-heading">
                          <label htmlFor={`${day}-open`}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </label>

                          <label className="business-hours-toggle">
                            <input
                              id={`${day}-open`}
                              type="checkbox"
                              checked={businessHours[day].is_open}
                              onChange={(event) =>
                                handleHoursChange(
                                  day,
                                  "is_open",
                                  event.target.checked,
                                )
                              }
                            />
                            <span>Open</span>
                          </label>
                        </div>

                        {businessHours[day].is_open ? (
                          <div className="business-hours-times">
                            <input
                              type="time"
                              aria-label={`${day} opening time`}
                              value={businessHours[day].open}
                              onChange={(event) =>
                                handleHoursChange(
                                  day,
                                  "open",
                                  event.target.value,
                                )
                              }
                            />

                            <span>to</span>

                            <input
                              type="time"
                              aria-label={`${day} closing time`}
                              value={businessHours[day].close}
                              onChange={(event) =>
                                handleHoursChange(
                                  day,
                                  "close",
                                  event.target.value,
                                )
                              }
                            />
                          </div>
                        ) : (
                          <p className="business-closed-label">Closed</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {errors.businessHours && (
                    <p className="field-error">{errors.businessHours}</p>
                  )}
                </fieldset>

                <div className="terms-checkbox">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.agreeToTerms)}
                  />

                  <label htmlFor="agreeToTerms">
                    I agree to the{" "}
                    <Link to="/terms-and-conditions">Terms and Conditions</Link>
                    .
                  </label>

                  {errors.agreeToTerms && (
                    <p className="field-error">{errors.agreeToTerms}</p>
                  )}
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div className="step-navigation">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="back-button"
                  onClick={handlePreviousStep}
                  disabled={submitting}
                >
                  Back
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  className="continue-button"
                  onClick={handleNextStep}
                  disabled={submitting}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Register Business"}
                </button>
              )}
            </div>
          </form>

          <p className="registration-footer">
            Your business information will help us build a trusted pet-care
            community.
          </p>
        </main>
      </div>
    </VendorLayout>
  );
}

export default BusinessRegistrationForm;

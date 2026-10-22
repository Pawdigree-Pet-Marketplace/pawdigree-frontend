import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import CountryFlag from "../CountryFlag/CountryFlag";
import "./BusinessRegistrationForm.css";

import API_BASE_URL from "../../services/api";

interface Category {
  id: number;
  name: string;
}

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

interface FormData {
  businessName: string;
  description: string;
  businessType: string;
  address: string;
  cityDistrict: string;
  businessPhone: string;
  businessEmail: string;
  agreeToTerms: boolean;
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
  description: "",
  businessType: "",
  address: "",
  cityDistrict: "",
  businessPhone: "",
  businessEmail: "",
  agreeToTerms: false,
};

function BusinessRegistrationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>("UG");
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [businessHours, setBusinessHours] =
    useState<BusinessHours>(initialBusinessHours);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  // Load available phone countries from the backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadCountries() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/country-codes/`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }
        );

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
          countryList.find((item) => item.iso_code === "UG") ??
          countryList[0];

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

  // Load the categories already created in the backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setLoadingCategories(true);

      try {
        const accessToken = localStorage.getItem("access");

        const headers: HeadersInit = {
          Accept: "application/json",
        };

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/categories/`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error(
            "The categories endpoint requires valid authentication. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            `Unable to load categories (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        const categoryList: Category[] = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [];

        setCategories(categoryList);

        if (categoryList.length === 0) {
          setErrors((previous) => ({
            ...previous,
            businessType:
              "No categories are available yet. Please contact the administrator.",
          }));
        } else {
          setErrors((previous) => {
            const updated = { ...previous };
            delete updated.businessType;
            return updated;
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setErrors((previous) => ({
          ...previous,
          businessType:
            error instanceof Error
              ? error.message
              : "Unable to load business categories.",
        }));
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => controller.abort();
  }, []);

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  function handleHoursChange(
    day: string,
    field: keyof DayHours,
    value: string | boolean
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

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Business description is required.";
    } else if (formData.description.trim().length > 500) {
      newErrors.description =
        "Description cannot exceed 500 characters.";
    }

    if (!formData.businessType) {
      newErrors.businessType = "Please select a business category.";
    }

    if (
      formData.businessType &&
      !categories.some(
        (category) => String(category.id) === formData.businessType
      )
    ) {
      newErrors.businessType = "Please select a valid category.";
    }

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
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)
    ) {
      newErrors.businessEmail = "Enter a valid email address.";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms =
        "You must agree to the terms and conditions.";
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessageType("error");
      setMessage("Please correct the highlighted fields.");
      return;
    }

    const accessToken = localStorage.getItem("access");

    if (!accessToken) {
      setMessageType("error");
      setMessage(
        "Please log in before registering your business. Your login session may have expired."
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
            description: formData.description.trim(),
            contact: phone?.number,
            email: formData.businessEmail.trim(),
            address: formData.address.trim(),
            city_district: formData.cityDistrict.trim(),
            category: Number(formData.businessType),
            business_hours: businessHours,
          }),
        }
      );

      const responseData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "Your login session is invalid or expired. Please log in again."
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
          details || "Business registration failed. Please try again."
        );
      }

      setMessageType("success");
      setMessage(
        "Your business registration has been submitted successfully."
      );
      setFormData(initialFormData);
      setBusinessHours(initialBusinessHours);
      setErrors({});
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="business-registration-page">
      <section className="business-registration-container">
        <h1>Register Your Business</h1>
        <p>
          Tell us about your business to get started on Pawdigree.
        </p>

        {message && (
          <div
            className={`form-message ${messageType}`}
            role="alert"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="businessName">Business name *</label>
            <input
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.businessName)}
            />
            {errors.businessName && (
              <p className="field-error">{errors.businessName}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Business description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
              rows={4}
              aria-invalid={Boolean(errors.description)}
            />
            <small>{formData.description.length}/500 characters</small>
            {errors.description && (
              <p className="field-error">{errors.description}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="businessType">Business category *</label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              disabled={loadingCategories || categories.length === 0}
              aria-invalid={Boolean(errors.businessType)}
            >
              <option value="">
                {loadingCategories
                  ? "Loading categories..."
                  : "Select a category"}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {errors.businessType && (
              <p className="field-error">{errors.businessType}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="address">Business address *</label>
            <input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              aria-invalid={Boolean(errors.address)}
            />
            {errors.address && (
              <p className="field-error">{errors.address}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="cityDistrict">City or district *</label>
            <input
              id="cityDistrict"
              name="cityDistrict"
              value={formData.cityDistrict}
              onChange={handleChange}
              aria-invalid={Boolean(errors.cityDistrict)}
            />
            {errors.cityDistrict && (
              <p className="field-error">{errors.cityDistrict}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="businessPhone">Business phone*</label>
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
            <label htmlFor="businessEmail">Business email *</label>
            <input
              id="businessEmail"
              name="businessEmail"
              type="email"
              value={formData.businessEmail}
              onChange={handleChange}
              aria-invalid={Boolean(errors.businessEmail)}
            />
            {errors.businessEmail && (
              <p className="field-error">{errors.businessEmail}</p>
            )}
          </div>

          <fieldset className="business-hours">
            <legend>Business operating hours</legend>

            {weekdays.map((day) => (
              <div className="business-hours-row" key={day}>
                <label htmlFor={`${day}-open`}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>

                <input
                  id={`${day}-open`}
                  type="checkbox"
                  checked={businessHours[day].is_open}
                  onChange={(event) =>
                    handleHoursChange(
                      day,
                      "is_open",
                      event.target.checked
                    )
                  }
                />

                <span>Open</span>

                {businessHours[day].is_open && (
                  <>
                    <input
                      type="time"
                      aria-label={`${day} opening time`}
                      value={businessHours[day].open}
                      onChange={(event) =>
                        handleHoursChange(
                          day,
                          "open",
                          event.target.value
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
                          event.target.value
                        )
                      }
                    />
                  </>
                )}
              </div>
            ))}

            {errors.businessHours && (
              <p className="field-error">{errors.businessHours}</p>
            )}
          </fieldset>

          <div className="form-group terms-checkbox">
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
              <a href="/terms-and-conditions">
                Terms and Conditions
              </a>
              .
            </label>

            {errors.agreeToTerms && (
              <p className="field-error">{errors.agreeToTerms}</p>
            )}
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Register Business"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default BusinessRegistrationForm;

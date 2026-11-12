import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  PawPrint,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import API_BASE_URL from "../../services/api";
import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import "./CustomerDashboard.css";
import "./AdoptionRequest.css";
type HomeType = "APARTMENT" | "HOUSE" | "OTHER";
type Experience = "NONE" | "SOME" | "EXPERIENCED";

type AdoptionForm = {
  home_type: HomeType | "";
  has_outdoor_space: boolean | null;
  has_other_pets: boolean | null;
  other_pets_details: string;
  previous_pet_experience: Experience | "";
  message: string;
};

type ApiErrors = Partial<
  Record<keyof AdoptionForm | "pet" | "detail", string>
>;

const initialForm: AdoptionForm = {
  home_type: "",
  has_outdoor_space: null,
  has_other_pets: null,
  other_pets_details: "",
  previous_pet_experience: "",
  message: "",
};

function getCustomerAccessToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token")
  );
}

export default function AdoptionRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AdoptionForm>(initialForm);
  const [errors, setErrors] = useState<ApiErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    applicationId: number | string;
    status: string;
  } | null>(null);

  // Open this page with /adoption-request?pet_id=123.
  const petId = Number(
    new URLSearchParams(window.location.search).get("pet_id"),
  );
  const petName = "your selected pet";

  function update<K extends keyof AdoptionForm>(
    key: K,
    value: AdoptionForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "has_other_pets" && value === false
        ? { other_pets_details: "" }
        : {}),
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
      detail: undefined,
    }));
  }

  function validateStep(currentStep: number): boolean {
    const nextErrors: ApiErrors = {};

    if (currentStep === 1) {
      if (!form.home_type) {
        nextErrors.home_type = "Choose your home type.";
      }
      if (form.has_outdoor_space === null) {
        nextErrors.has_outdoor_space = "Please choose yes or no.";
      }
      if (form.has_other_pets === null) {
        nextErrors.has_other_pets = "Please choose yes or no.";
      }
      if (form.has_other_pets && form.other_pets_details.length > 200) {
        nextErrors.other_pets_details =
          "Keep this answer to 200 characters or fewer.";
      }
    }

    if (currentStep === 2) {
      if (!form.previous_pet_experience) {
        nextErrors.previous_pet_experience =
          "Choose your previous pet experience.";
      }
      if (!form.message.trim()) {
        nextErrors.message = "Tell us why you want to adopt this pet.";
      } else if (form.message.length > 2000) {
        nextErrors.message =
          "Keep your message to 2,000 characters or fewer.";
      }
    }

    if (
      currentStep === 3 &&
      (!Number.isInteger(petId) || petId < 1)
    ) {
      nextErrors.pet =
        "We couldn't identify this pet. Return to the pet details page and select Apply to Adopt again.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function continueStep() {
    if (validateStep(step)) {
      setStep((current) => Math.min(3, current + 1));
    }
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    const token = getCustomerAccessToken();

    if (!token) {
      setErrors({
        detail:
          "Please log in with your customer account before submitting an adoption request.",
      });
      return;
    }

    const payload = {
      pet: petId,
      home_type: form.home_type,
      has_outdoor_space: form.has_outdoor_space,
      has_other_pets: form.has_other_pets,
      ...(form.has_other_pets
        ? { other_pets_details: form.other_pets_details.trim() }
        : {}),
      previous_pet_experience: form.previous_pet_experience,
      message: form.message.trim(),
    };

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/adoptions/applications/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 201) {
        setSuccess({
          applicationId: data.application_id ?? "—",
          status: data.status ?? "PENDING",
        });
        return;
      }

      if (response.status === 401) {
        setErrors({
          detail:
            "Your session may have expired. Please log in again as a customer.",
        });
      } else if (response.status === 403) {
        setErrors({
          detail:
            "Only customer accounts can submit adoption applications. Please switch to a customer account.",
        });
      } else if (response.status === 404) {
        setErrors({
          pet: data.detail || "This pet is not available.",
        });
      } else if (response.status === 400) {
        const apiErrors: ApiErrors = {};

        if (data.pet) {
          apiErrors.pet = Array.isArray(data.pet)
            ? data.pet.join(" ")
            : String(data.pet);
        }

        const fieldNames = [
          "home_type",
          "has_outdoor_space",
          "has_other_pets",
          "other_pets_details",
          "previous_pet_experience",
          "message",
        ] as const;

        for (const key of fieldNames) {
          if (data[key]) {
            apiErrors[key] = Array.isArray(data[key])
              ? data[key].join(" ")
              : String(data[key]);
          }
        }

        if (Object.keys(apiErrors).length === 0) {
          apiErrors.detail =
            data.detail || "Please check your details and try again.";
        }

        setErrors(apiErrors);

        if (
          data.home_type ||
          data.has_outdoor_space ||
          data.has_other_pets ||
          data.other_pets_details
        ) {
          setStep(1);
        } else if (data.previous_pet_experience || data.message) {
          setStep(2);
        }
      } else {
        setErrors({
          detail:
            data.detail ||
            "We couldn't submit your request right now. Please try again.",
        });
      }
    } catch {
      setErrors({
        detail:
          "Could not connect to Pawdigree. Check your internet connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="customer-dashboard-layout">
        <CustomerDashboardNav />

        <main className="customer-dashboard-main adoption-page">
          <header className="adoption-header">
            <span />
            <h1>Adoption application</h1>
            <div className="header-icons" aria-hidden="true">
              <ShoppingCart />
              <UserRound />
            </div>
          </header>

          <section className="adoption-success" role="status">
            <span className="success-mark">
              <Check size={30} />
            </span>
            <h2>Application submitted!</h2>
            <p>
              Your adoption request has been sent successfully. The application
              status is <strong>{success.status}</strong>.
            </p>
            <p>
              Application reference: <strong>{success.applicationId}</strong>
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Back to Pawdigree
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="customer-dashboard-layout">
      <CustomerDashboardNav />

      <main className="customer-dashboard-main adoption-page">
        <header className="adoption-header">
          <button
            className="back-icon"
            type="button"
            onClick={step === 1 ? () => window.history.back() : goBack}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          <h1>Adoption application</h1>

          <div className="header-icons" aria-hidden="true">
            <ShoppingCart />
            <UserRound />
          </div>
        </header>

        <section className="adoption-content">
          <div className="step-heading">
            <span>
              Step {step} of 3 ·{" "}
              {step === 1
                ? "About your home"
                : step === 2
                  ? "Experience & message"
                  : "Review application"}
            </span>

            <div
              className="progress-track"
              aria-label={`Step ${step} of 3`}
            >
              <div
                className="progress-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="adoption-columns">
            <aside className="adoption-sidebar">
              <section className="pet-summary">
                <div className="pet-placeholder">
                  <PawPrint size={34} />
                  <small>PET PHOTO</small>
                </div>

                <div className="pet-summary-text">
                  <h2>Adopt {petName}</h2>
                  <p>
                    Pet ID:{" "}
                    {Number.isInteger(petId) && petId > 0
                      ? petId
                      : "Not selected"}
                  </p>
                  <span className="verified">
                    <Check size={16} /> Adoption request
                  </span>
                </div>
              </section>

              <section className="next-steps">
                <h2>What happens next</h2>

                <div
                  className={`timeline-item ${step >= 1 ? "current" : ""}`}
                >
                  <span>{step > 1 ? <Check size={17} /> : null}</span>
                  <b>Application details</b>
                </div>

                <div
                  className={`timeline-item ${step >= 2 ? "current" : ""}`}
                >
                  <span>{step > 2 ? <Check size={17} /> : null}</span>
                  <b>Review application</b>
                </div>

                <div className={`timeline-item ${success ? "done" : ""}`}>
                  <span />
                  <b>Vendor review</b>
                </div>
              </section>
            </aside>

            <form
              className="adoption-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {errors.detail && (
                <div className="api-error" role="alert">
                  {errors.detail}
                </div>
              )}

              {errors.pet && (
                <div className="api-error" role="alert">
                  {errors.pet}
                </div>
              )}

              {step === 1 && (
                <>
                  <div className="form-intro">
                    <h2>About your home</h2>
                    <p>
                      Tell us about the environment this pet will live in.
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="home_type">
                      What type of home do you live in? <span>*</span>
                    </label>

                    <div className="select-wrap">
                      <select
                        id="home_type"
                        value={form.home_type}
                        onChange={(event) =>
                          update(
                            "home_type",
                            event.target.value as HomeType | "",
                          )
                        }
                        aria-invalid={!!errors.home_type}
                      >
                        <option value="">Select home type</option>
                        <option value="APARTMENT">Apartment</option>
                        <option value="HOUSE">House</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <ChevronDown size={19} />
                    </div>

                    {errors.home_type && (
                      <small className="field-error">
                        {errors.home_type}
                      </small>
                    )}
                  </div>

                  <BooleanField
                    label="Do you have outdoor space?"
                    value={form.has_outdoor_space}
                    onChange={(value) =>
                      update("has_outdoor_space", value)
                    }
                    error={errors.has_outdoor_space}
                  />

                  <BooleanField
                    label="Do you currently have other pets?"
                    value={form.has_other_pets}
                    onChange={(value) => update("has_other_pets", value)}
                    error={errors.has_other_pets}
                  />

                  {form.has_other_pets && (
                    <div className="field">
                      <label htmlFor="other_pets_details">
                        Tell us about your other pets{" "}
                        <span className="optional-label">(optional)</span>
                      </label>

                      <textarea
                        id="other_pets_details"
                        maxLength={200}
                        rows={3}
                        value={form.other_pets_details}
                        onChange={(event) =>
                          update("other_pets_details", event.target.value)
                        }
                        placeholder="Species, age, and temperament (optional)"
                        aria-invalid={!!errors.other_pets_details}
                      />

                      <small className="character-count">
                        {form.other_pets_details.length}/200 characters
                      </small>

                      {errors.other_pets_details && (
                        <small className="field-error">
                          {errors.other_pets_details}
                        </small>
                      )}
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={continueStep}
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="form-intro">
                    <h2>Experience & motivation</h2>
                    <p>
                      Help the vendor understand your experience and why you
                      would like to adopt this pet.
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="previous_pet_experience">
                      Previous pet experience <span>*</span>
                    </label>

                    <div className="select-wrap">
                      <select
                        id="previous_pet_experience"
                        value={form.previous_pet_experience}
                        onChange={(event) =>
                          update(
                            "previous_pet_experience",
                            event.target.value as Experience | "",
                          )
                        }
                        aria-invalid={!!errors.previous_pet_experience}
                      >
                        <option value="">Select your experience</option>
                        <option value="NONE">First-time owner</option>
                        <option value="SOME">Some experience</option>
                        <option value="EXPERIENCED">Experienced</option>
                      </select>
                      <ChevronDown size={19} />
                    </div>

                    {errors.previous_pet_experience && (
                      <small className="field-error">
                        {errors.previous_pet_experience}
                      </small>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="message">
                      Why do you want to adopt this pet? <span>*</span>
                    </label>

                    <textarea
                      id="message"
                      className="reason-textarea"
                      maxLength={2000}
                      value={form.message}
                      onChange={(event) =>
                        update("message", event.target.value)
                      }
                      placeholder="Tell us why you would be a good match..."
                      aria-invalid={!!errors.message}
                    />

                    <small className="character-count">
                      {form.message.length}/2000 characters
                    </small>

                    {errors.message && (
                      <small className="field-error">
                        {errors.message}
                      </small>
                    )}
                  </div>

                  <div className="form-actions split-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={goBack}
                    >
                      Back
                    </button>

                    <button
                      className="primary-button"
                      type="button"
                      onClick={continueStep}
                    >
                      Review application
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="form-intro">
                    <h2>Review your application</h2>
                    <p>
                      Check the details below before sending your adoption
                      request.
                    </p>
                  </div>

                  <section className="review-section">
                    <div className="review-title">
                      <h3>About your home</h3>
                      <button type="button" onClick={() => setStep(1)}>
                        Edit
                      </button>
                    </div>

                    <ReviewRow
                      label="Home type"
                      value={
                        form.home_type === "APARTMENT"
                          ? "Apartment"
                          : form.home_type === "HOUSE"
                            ? "House"
                            : "Other"
                      }
                    />
                    <ReviewRow
                      label="Outdoor space"
                      value={form.has_outdoor_space ? "Yes" : "No"}
                    />
                    <ReviewRow
                      label="Other pets"
                      value={form.has_other_pets ? "Yes" : "No"}
                    />

                    {form.has_other_pets && (
                      <ReviewRow
                        label="Other pets details"
                        value={form.other_pets_details || "Not provided"}
                      />
                    )}
                  </section>

                  <section className="review-section">
                    <div className="review-title">
                      <h3>Experience & motivation</h3>
                      <button type="button" onClick={() => setStep(2)}>
                        Edit
                      </button>
                    </div>

                    <ReviewRow
                      label="Experience"
                      value={
                        form.previous_pet_experience === "NONE"
                          ? "First-time owner"
                          : form.previous_pet_experience === "SOME"
                            ? "Some experience"
                            : "Experienced"
                      }
                    />
                    <ReviewRow
                      label="Your message"
                      value={form.message}
                    />
                  </section>

                  <p className="review-note">
                    Your application will be submitted to the vendor for
                    review. Only customer accounts can submit adoption
                    requests.
                  </p>

                  <div className="form-actions split-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={goBack}
                    >
                      Back
                    </button>

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit application"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function BooleanField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  error?: string;
}) {
  return (
    <div className="field">
      <span className="field-label">
        {label} <span className="required-star">*</span>
      </span>

      <div className="boolean-options">
        <label>
          <input
            type="radio"
            name={label}
            checked={value === true}
            onChange={() => onChange(true)}
          />
          Yes
        </label>

        <label>
          <input
            type="radio"
            name={label}
            checked={value === false}
            onChange={() => onChange(false)}
          />
          No
        </label>
      </div>

      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="review-row">
      <span>{label}</span>
      <p>{value || "—"}</p>
    </div>
  );
}

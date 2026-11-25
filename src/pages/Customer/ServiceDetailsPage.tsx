
import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  PawPrint,
  Star,
  Store,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { fetchServiceById } from "../../services/publicServicesApi";
import {
  fetchServiceAvailableTimes,
  createServiceBooking,
} from "../../services/bookings/bookingApi";
import type { FreeTimesResponse } from "../../services/bookings/bookingApi";
import { getSessionRole } from "../../services/auth/authStorage";
import ReviewsSection from "../../components/reviews/ReviewsSection";
import type { Service } from "../../data/services";
import "./ServiceDetailsPage.css";

// Maximum number of words allowed in additional booking notes.
const MAX_NOTES_WORDS = 300;

// Count words separated by whitespace.
function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

// Get today's date using Kampala time, not UTC.
function getKampalaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatPrice(price: string): string {
  const amount = Number(price);

  if (Number.isNaN(amount)) {
    return `UGX ${price}`;
  }

  return `UGX ${amount.toLocaleString("en-UG")}`;
}

function formatDuration(duration: number): string {
  if (duration < 60) {
    return `${duration} minutes`;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} hr ${minutes} min`;
}

// Display an API appointment time in Kampala time.
function formatAppointmentTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: "Africa/Kampala",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDateTime));
}

/* Shared Pawdigree-style banner */
function ServiceDetailsHero() {
  return (
    <header className="service-details-hero">
      <div
        className="service-details-hero-decoration"
        aria-hidden="true"
      >
        <PawPrint size={58} />
        <PawPrint size={38} />
      </div>

      <nav
        className="service-details-breadcrumb"
        aria-label="Breadcrumb"
      >
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/services">Pet Services</Link>
        <span>/</span>
        <span aria-current="page">Service Details</span>
      </nav>

      <p className="service-details-eyebrow">
        Care for every paw
      </p>

      <h1>Discover the Care Your Pet Deserves</h1>

      <p className="service-details-hero-description">
        Explore service information, pricing, availability and the
        business providing the care.
      </p>
    </header>
  );
}

function ServiceDetailsPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const initialParams = new URLSearchParams(location.search);

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking form state.
  const [selectedDate, setSelectedDate] = useState(
    initialParams.get("bookingDate") || getKampalaToday(),
  );
  const [availableTimes, setAvailableTimes] =
    useState<FreeTimesResponse | null>(null);
  const [selectedTime, setSelectedTime] = useState(
    initialParams.get("bookingTime") || "",
  );
  const [timesLoading, setTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // Current number of words in the additional notes field.
  const notesWordCount = countWords(notes);

  // Handle notes input and enforce the 300-word limit.
  function handleNotesChange(value: string) {
    const words = value.trim().split(/\s+/).filter(Boolean);

    if (words.length > MAX_NOTES_WORDS) {
      setNotes(words.slice(0, MAX_NOTES_WORDS).join(" "));
    } else {
      setNotes(value);
    }
  }

  // Load service details.
  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      if (!serviceId) {
        setError("The service ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchServiceById(serviceId);

        if (!cancelled) {
          setService(data);
        }
      } catch {
        if (!cancelled) {
          setError(
            "We could not load this service. It may no longer be available.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadService();

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  // Load available appointment times whenever the date changes.
  // This request is public, so guests can use it too.
  useEffect(() => {
    let cancelled = false;

    async function loadAvailableTimes() {
      if (!serviceId || !selectedDate) return;

      setTimesLoading(true);
      setTimesError("");
      setAvailableTimes(null);
      setBookingError("");
      setBookingSuccess("");

      try {
        const data = await fetchServiceAvailableTimes(
          Number(serviceId),
          selectedDate,
        );

        if (cancelled) return;

        setAvailableTimes(data);

        // Restore a previously selected appointment after login,
        // but only if the backend still returns that appointment.
        const params = new URLSearchParams(location.search);
        const requestedTime = params.get("bookingTime");

        if (requestedTime && data.times.includes(requestedTime)) {
          setSelectedTime(requestedTime);
        } else {
          setSelectedTime("");
        }
      } catch (err) {
        if (!cancelled) {
          setTimesError(
            err instanceof Error
              ? err.message
              : "Unable to load available appointment times.",
          );
        }
      } finally {
        if (!cancelled) {
          setTimesLoading(false);
        }
      }
    }

    void loadAvailableTimes();

    return () => {
      cancelled = true;
    };
  }, [serviceId, selectedDate, location.search]);

  // Handle a date change.
  function handleDateChange(value: string) {
    setSelectedDate(value);
    setSelectedTime("");
    setBookingError("");
    setBookingSuccess("");
  }

  // Submit a booking.
  async function handleBookingSubmit() {
    if (!serviceId || !selectedTime) {
      setBookingError("Please select an available appointment time.");
      return;
    }

    // Only authenticated customers can submit bookings.
    if (getSessionRole() !== "CUSTOMER") {
      const params = new URLSearchParams({
        bookingDate: selectedDate,
        bookingTime: selectedTime,
      });

      navigate("/login", {
        state: {
          from: {
            pathname: `/services/${serviceId}`,
            search: `?${params.toString()}`,
          },
        },
      });

      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");
      setBookingSuccess("");

      const booking = await createServiceBooking({
        service: Number(serviceId),
        start_at: selectedTime,
        notes: notes.trim(),
      });

      setBookingSuccess(
        `Your booking request was submitted successfully. Booking reference: #${booking.booking_id}. Status: ${booking.status_display || booking.status}.`,
      );

      setSelectedTime("");
      setNotes("");
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "We could not submit your booking. Please try again.",
      );
    } finally {
      setBookingLoading(false);
    }
  }

  /* Loading state */
  if (loading) {
    return (
      <main className="service-details-page">
        <ServiceDetailsHero />

        <div className="service-details-message">
          <div className="service-details-spinner" />
          <p>Loading service details...</p>
        </div>
      </main>
    );
  }

  /* Error or unavailable state */
  if (error || !service) {
    return (
      <main className="service-details-page">
        <ServiceDetailsHero />

        <div className="service-details-message">
          <PawPrint size={42} />

          <h2>Service unavailable</h2>

          <p>{error || "We could not find this service."}</p>

          <Link
            to="/services"
            className="service-details-back-button"
          >
            <ArrowLeft size={18} />
            Back to services
          </Link>
        </div>
      </main>
    );
  }

  const available =
    service.availability_status?.toLowerCase() === "available";

  /* Successfully loaded service details */
  return (
    <main className="service-details-page">
      <ServiceDetailsHero />

      <div className="service-details-container">
        <Link
          to="/services"
          className="service-details-back-link"
        >
          <ArrowLeft size={18} />
          Back to services
        </Link>

        <div className="service-details-content">
          {/* Service image */}
          <div className="service-details-image-section">
            {service.image ? (
              <img
                src={service.image}
                alt={service.name}
                className="service-details-image"
              />
            ) : (
              <div className="service-details-image-placeholder">
                <PawPrint size={76} />
                <span>Pet Care Service</span>
              </div>
            )}
          </div>

          {/* Service information */}
          <section className="service-details-information">
            <div className="service-details-category">
              {service.category_name || service.service_type}
            </div>

            <div className="service-details-title-row">
              <h2>{service.name}</h2>

              <span
                className={`service-details-status ${
                  available ? "is-available" : "is-unavailable"
                }`}
              >
                {service.availability_status ||
                  "Availability not specified"}
              </span>
            </div>

            {/* Rating */}
            <div className="service-details-rating">
              <Star size={18} fill="currentColor" />

              <strong>
                {Number(service.average_rating || 0).toFixed(1)}
              </strong>

              <span>
                ({service.review_count || 0}{" "}
                {(service.review_count || 0) === 1
                  ? "review"
                  : "reviews"}
                )
              </span>
            </div>

            {/* Price */}
            <div className="service-details-price">
              {formatPrice(service.price)}
            </div>

            {/* Duration and location */}
            <div className="service-details-facts">
              <div className="service-details-fact">
                <Clock3 size={20} />

                <div>
                  <span>Duration</span>
                  <strong>{formatDuration(service.duration)}</strong>
                </div>
              </div>

              <div className="service-details-fact">
                <MapPin size={20} />

                <div>
                  <span>Location</span>
                  <strong>
                    {service.city_district || "Not specified"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="service-details-description">
              <h3>About this service</h3>

              <p>
                {service.description ||
                  "No description has been provided."}
              </p>
            </div>

            {/* Service provider */}
            <div className="service-details-vendor">
              <Store size={22} />

              <div>
                <span>Provided by</span>

                <strong>
                  {service.business_name || "Vendor not specified"}
                </strong>
              </div>
            </div>
          </section>
        </div>

        {/* Booking form */}
        <section
          className="service-booking-card"
          aria-labelledby="service-booking-heading"
        >
          <div className="service-booking-heading">
            <div className="service-booking-heading-icon">
              <CalendarDays size={24} />
            </div>

            <div>
              <p className="service-booking-eyebrow">
                Schedule your visit
              </p>
              <h2 id="service-booking-heading">
                Book This Service
              </h2>
              <p>
                Choose a convenient date and available appointment
                time for your pet.
              </p>
            </div>
          </div>

          {!available ? (
            <div className="service-booking-unavailable">
              <AlertCircle size={20} />
              <p>
                This service is currently unavailable for booking.
                Please check again later.
              </p>
            </div>
          ) : (
            <>
              {/* Date selection */}
              <div className="service-booking-field">
                <label htmlFor="booking-date">
                  Select appointment date
                </label>

                <input
                  id="booking-date"
                  type="date"
                  min={getKampalaToday()}
                  value={selectedDate}
                  onChange={(event) =>
                    handleDateChange(event.target.value)
                  }
                />
              </div>

              {/* Available appointment times */}
              <div className="service-booking-times-section">
                <h3>Available appointment times</h3>

                {timesLoading ? (
                  <p className="service-booking-loading">
                    Loading available times...
                  </p>
                ) : timesError ? (
                  <div className="service-booking-feedback is-error">
                    <AlertCircle size={18} />
                    <span>{timesError}</span>
                  </div>
                ) : availableTimes?.times.length ? (
                  <div className="service-booking-times">
                    {availableTimes.times.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`service-booking-time ${
                          selectedTime === time ? "is-selected" : ""
                        }`}
                        aria-pressed={selectedTime === time}
                        onClick={() => {
                          setSelectedTime(time);
                          setBookingError("");
                          setBookingSuccess("");
                        }}
                      >
                        {formatAppointmentTime(time)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="service-booking-empty">
                    No appointment times are available for this date.
                    Please choose another date.
                  </p>
                )}
              </div>

              {/* Optional notes - maximum 300 words */}
              <div className="service-booking-field">
                <label htmlFor="booking-notes">
                  Additional notes{" "}
                  <span>(Optional)</span>
                </label>

                <textarea
                  id="booking-notes"
                  rows={4}
                  placeholder="Tell the service provider anything they should know about your pet..."
                  value={notes}
                  onChange={(event) =>
                    handleNotesChange(event.target.value)
                  }
                />

                <small aria-live="polite">
                  {notesWordCount}/{MAX_NOTES_WORDS} words
                </small>
              </div>

              {/* Booking feedback */}
              {bookingError && (
                <div
                  className="service-booking-feedback is-error"
                  role="alert"
                >
                  <AlertCircle size={18} />
                  <span>{bookingError}</span>
                </div>
              )}

              {bookingSuccess && (
                <div
                  className="service-booking-feedback is-success"
                  role="status"
                >
                  <CheckCircle2 size={19} />
                  <span>{bookingSuccess}</span>
                </div>
              )}

              {/* Confirm booking */}
              <button
                type="button"
                className="service-booking-submit"
                onClick={handleBookingSubmit}
                disabled={
                  !selectedTime ||
                  timesLoading ||
                  bookingLoading ||
                  !available
                }
              >
                {bookingLoading
                  ? "Submitting booking..."
                  : "Confirm Booking"}
              </button>

              <p className="service-booking-note">
                Your booking request will be sent to the service
                provider for review.
              </p>
            </>
          )}
        </section>
        <ReviewsSection kind="service" targetId={Number(serviceId)} />
      </div>
    </main>
  );
}

export default ServiceDetailsPage;

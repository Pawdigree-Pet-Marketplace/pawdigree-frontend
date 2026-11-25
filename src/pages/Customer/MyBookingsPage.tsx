
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  RefreshCw,
  PawPrint,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
  ClipboardList,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  cancelCustomerBooking,
  fetchCustomerBookings,
  fetchServiceAvailableTimes,
  rescheduleCustomerBooking,
  type BookingResponse,
  type BookingStatus,
  type FreeTimesResponse,
} from "../../services/bookings/bookingApi";
import "./MyBookingsPage.css";

type DialogMode = "cancel" | "reschedule" | null;

// Labels and styling for each possible booking status.
const statusConfig: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "pending" },
  accepted: { label: "Accepted", className: "accepted" },
  declined: { label: "Declined", className: "declined" },
  completed: { label: "Completed", className: "completed" },
  cancelled: { label: "Cancelled", className: "cancelled" },
};

// Get a date in Kampala using a supplied Date value.
function getKampalaToday(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

// Format dates using Uganda's local timezone.
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "full",
    timeZone: "Africa/Kampala",
  }).format(new Date(dateString));
}

// Format appointment times using Uganda's local timezone.
function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat("en-UG", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Kampala",
  }).format(new Date(dateString));
}

// Combine date and time for the booking creation date.
function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

// Display an appropriate icon for each booking status.
function BookingStatusIcon({ status }: { status: BookingStatus }) {
  switch (status) {
    case "pending":
      return <Hourglass size={16} />;

    case "accepted":
    case "completed":
      return <CheckCircle2 size={16} />;

    case "declined":
    case "cancelled":
      return <XCircle size={16} />;

    default:
      return null;
  }
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeBooking, setActiveBooking] =
    useState<BookingResponse | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [today, setToday] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<
    FreeTimesResponse["times"]
  >([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Initialize the current time and Kampala date after an API request completes.
  const initializeTimeContext = () => {
    const now = new Date();
    const kampalaDate = getKampalaToday(now);

    setCurrentTime(now.getTime());
    setToday(kampalaDate);
    setSelectedDate(kampalaDate);
  };

  // Load the customer's bookings when the page first opens.
  useEffect(() => {
    let cancelled = false;

    fetchCustomerBookings()
      .then((data) => {
        if (!cancelled) {
          initializeTimeContext();
          setBookings(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          initializeTimeContext();
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading your bookings.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load available times whenever the rescheduling date changes.
  useEffect(() => {
    if (
      !activeBooking ||
      dialogMode !== "reschedule" ||
      !selectedDate
    ) {
      return;
    }

    let cancelled = false;

    fetchServiceAvailableTimes(activeBooking.service, selectedDate)
      .then((data) => {
        if (!cancelled) {
          setAvailableTimes(data.times);
          setAvailabilityError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAvailableTimes([]);
          setAvailabilityError(
            err instanceof Error
              ? err.message
              : "Unable to load available appointment times.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeBooking, dialogMode, selectedDate]);

  // Allow the customer to retry if loading fails.
  const handleRetry = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchCustomerBookings();
      setBookings(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your bookings.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Open the cancellation confirmation dialog.
  const handleOpenCancel = (booking: BookingResponse) => {
    setActiveBooking(booking);
    setDialogMode("cancel");
    setActionError("");
    setFeedback("");
  };

  // Open the rescheduling dialog and load available times.
  const handleOpenReschedule = (booking: BookingResponse) => {
    setActiveBooking(booking);
    setDialogMode("reschedule");
    setSelectedDate(today);
    setSelectedTime("");
    setAvailableTimes([]);
    setAvailabilityError("");
    setAvailabilityLoading(true);
    setActionError("");
    setFeedback("");
  };

  // Close the active dialog.
  const handleCloseDialog = () => {
    if (actionLoading) return;

    setDialogMode(null);
    setActiveBooking(null);
    setActionError("");
    setAvailabilityError("");
    setSelectedTime("");
  };

  // Replace the affected booking with the updated API response.
  const updateBooking = (updatedBooking: BookingResponse) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.booking_id === updatedBooking.booking_id
          ? updatedBooking
          : booking,
      ),
    );
  };

  // Confirm and submit a cancellation.
  const handleConfirmCancel = async () => {
    if (!activeBooking) return;

    setActionLoading(true);
    setActionError("");

    try {
      const updatedBooking = await cancelCustomerBooking(
        activeBooking.booking_id,
      );

      updateBooking(updatedBooking);
      setFeedback(
        `Booking #${updatedBooking.booking_id} has been cancelled successfully.`,
      );
      setDialogMode(null);
      setActiveBooking(null);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to cancel your booking. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Submit the selected new appointment time.
  const handleConfirmReschedule = async () => {
    if (!activeBooking || !selectedTime) {
      setActionError("Please select an available appointment time.");
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const updatedBooking = await rescheduleCustomerBooking(
        activeBooking.booking_id,
        selectedTime,
      );

      updateBooking(updatedBooking);
      setFeedback(
        `Booking #${updatedBooking.booking_id} has been rescheduled. It is now awaiting vendor approval.`,
      );
      setDialogMode(null);
      setActiveBooking(null);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to reschedule your booking. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Only pending and accepted future bookings can be managed.
  const canManageBooking = (booking: BookingResponse): boolean => {
    if (currentTime === null) {
      return false;
    }

    const isManageableStatus =
      booking.status === "pending" || booking.status === "accepted";

    const appointmentHasNotStarted =
      new Date(booking.start_at).getTime() > currentTime;

    return isManageableStatus && appointmentHasNotStarted;
  };

  return (
    <main className="my-bookings-page">
      {/* Page hero banner */}
      <section className="my-bookings-hero">
        <div className="my-bookings-hero-content">
          <div className="my-bookings-eyebrow">
            <PawPrint size={17} />
            <span>Your pet care journey</span>
          </div>

          <h1>My Bookings</h1>

          <p>
            Keep track of your pet service appointments and stay updated on
            their booking status.
          </p>
        </div>

        <div className="my-bookings-hero-decoration" aria-hidden="true">
          <PawPrint className="hero-paw hero-paw-one" />
          <PawPrint className="hero-paw hero-paw-two" />
          <CalendarDays className="hero-calendar" />
        </div>
      </section>

      {/* Booking list heading */}
      <section className="my-bookings-content">
        <div className="my-bookings-heading">
          <div>
            <h2>Your appointments</h2>
            <p>View and manage your service bookings.</p>
          </div>

          {!loading && !error && (
            <span className="my-bookings-count">
              {bookings.length}{" "}
              {bookings.length === 1 ? "booking" : "bookings"}
            </span>
          )}
        </div>

        {/* Success feedback */}
        {feedback && (
          <div className="my-bookings-feedback" role="status">
            <CheckCircle2 size={19} />
            <span>{feedback}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setFeedback("")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="my-bookings-message" role="status">
            <RefreshCw className="my-bookings-spinner" size={25} />
            <h3>Loading your bookings...</h3>
            <p>Please wait while we retrieve your appointments.</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="my-bookings-message my-bookings-error" role="alert">
            <AlertCircle size={30} />
            <h3>We couldn't load your bookings</h3>
            <p>{error}</p>

            <button
              type="button"
              className="my-bookings-retry"
              onClick={handleRetry}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bookings.length === 0 && (
          <div className="my-bookings-message my-bookings-empty">
            <div className="my-bookings-empty-icon">
              <ClipboardList size={34} />
            </div>

            <h3>No bookings yet</h3>

            <p>
              You haven't booked any pet services yet. Explore our available
              services to get started.
            </p>

            <Link to="/services" className="my-bookings-browse-link">
              Browse pet services
            </Link>
          </div>
        )}

        {/* Customer booking cards */}
        {!loading && !error && bookings.length > 0 && (
          <div className="my-bookings-list">
            {bookings.map((booking) => {
              const status = statusConfig[booking.status];

              return (
                <article
                  className="my-booking-card"
                  key={booking.booking_id}
                >
                  <div className="my-booking-card-top">
                    <div className="my-booking-service">
                      <div className="my-booking-service-icon">
                        <PawPrint size={22} />
                      </div>

                      <div>
                        <span className="my-booking-reference">
                          Booking #{booking.booking_id}
                        </span>

                        <h3>{booking.service_name}</h3>
                      </div>
                    </div>

                    <span
                      className={`my-booking-status ${status.className}`}
                    >
                      <BookingStatusIcon status={booking.status} />
                      {status.label}
                    </span>
                  </div>

                  {/* Appointment date and time */}
                  <div className="my-booking-details">
                    <div className="my-booking-detail">
                      <CalendarDays size={18} />

                      <div>
                        <span>Appointment date</span>
                        <strong>{formatDate(booking.start_at)}</strong>
                      </div>
                    </div>

                    <div className="my-booking-detail">
                      <Clock size={18} />

                      <div>
                        <span>Appointment time</span>
                        <strong>
                          {formatTime(booking.start_at)} –{" "}
                          {formatTime(booking.end_at)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Customer's booking notes */}
                  {booking.notes?.trim() && (
                    <div className="my-booking-note">
                      <strong>Your notes</strong>
                      <p>{booking.notes}</p>
                    </div>
                  )}

                  {/* Reason provided when a booking is declined */}
                  {booking.status === "declined" &&
                    booking.decision_reason?.trim() && (
                      <div className="my-booking-decision">
                        <strong>Reason for declining</strong>
                        <p>{booking.decision_reason}</p>
                      </div>
                    )}

                  {/* Booking management actions */}
                  {canManageBooking(booking) && (
                    <div className="my-booking-actions">
                      <button
                        type="button"
                        className="my-booking-reschedule-button"
                        onClick={() => handleOpenReschedule(booking)}
                      >
                        <CalendarDays size={16} />
                        Reschedule
                      </button>

                      <button
                        type="button"
                        className="my-booking-cancel-button"
                        onClick={() => handleOpenCancel(booking)}
                      >
                        <XCircle size={16} />
                        Cancel booking
                      </button>
                    </div>
                  )}

                  {/* Booking creation date */}
                  <div className="my-booking-created">
                    Booked on {formatDateTime(booking.created_at)}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Booking management dialogs */}
      {dialogMode && activeBooking && (
        <div className="my-booking-modal-overlay">
          <section
            className="my-booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-booking-modal-title"
          >
            <div className="my-booking-modal-header">
              <div>
                <span>Booking #{activeBooking.booking_id}</span>
                <h2 id="my-booking-modal-title">
                  {dialogMode === "cancel"
                    ? "Cancel booking?"
                    : "Reschedule booking"}
                </h2>
              </div>

              <button
                type="button"
                className="my-booking-modal-close"
                aria-label="Close dialog"
                onClick={handleCloseDialog}
                disabled={actionLoading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="my-booking-modal-content">
              {dialogMode === "cancel" ? (
                <>
                  <p>
                    Are you sure you want to cancel your{" "}
                    <strong>{activeBooking.service_name}</strong> appointment?
                  </p>

                  <p className="my-booking-modal-hint">
                    This action will cancel your booking and release the
                    appointment time for other customers.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Choose a new date and available appointment time for{" "}
                    <strong>{activeBooking.service_name}</strong>.
                  </p>

                  <div className="my-booking-form-field">
                    <label htmlFor="reschedule-date">
                      New appointment date
                    </label>

                    <input
                      id="reschedule-date"
                      type="date"
                      min={today}
                      value={selectedDate}
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        setSelectedTime("");
                        setAvailabilityLoading(true);
                        setAvailableTimes([]);
                        setAvailabilityError("");
                      }}
                    />
                  </div>

                  <div className="my-booking-form-field">
                    <label htmlFor="reschedule-time">
                      Available appointment times
                    </label>

                    <select
                      id="reschedule-time"
                      value={selectedTime}
                      onChange={(event) =>
                        setSelectedTime(event.target.value)
                      }
                      disabled={
                        availabilityLoading || availableTimes.length === 0
                      }
                    >
                      <option value="">
                        {availabilityLoading
                          ? "Loading available times..."
                          : availableTimes.length === 0
                            ? "No available times"
                            : "Select an appointment time"}
                      </option>

                      {availableTimes.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>

                    {availabilityLoading && (
                      <span className="my-booking-field-hint">
                        Checking available appointment times...
                      </span>
                    )}

                    {!availabilityLoading &&
                      !availabilityError &&
                      availableTimes.length === 0 && (
                        <span className="my-booking-field-hint">
                          No appointments are available on this date. Please
                          choose another date.
                        </span>
                      )}

                    {availabilityError && (
                      <span className="my-booking-field-error" role="alert">
                        {availabilityError}
                      </span>
                    )}
                  </div>

                  <p className="my-booking-modal-hint">
                    Your rescheduled booking will return to Pending while the
                    vendor reviews the new appointment time.
                  </p>
                </>
              )}

              {actionError && (
                <div className="my-booking-action-error" role="alert">
                  <AlertCircle size={17} />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            <div className="my-booking-modal-actions">
              <button
                type="button"
                className="my-booking-modal-secondary"
                onClick={handleCloseDialog}
                disabled={actionLoading}
              >
                Go back
              </button>

              {dialogMode === "cancel" ? (
                <button
                  type="button"
                  className="my-booking-modal-danger"
                  onClick={handleConfirmCancel}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Cancelling..." : "Confirm cancellation"}
                </button>
              ) : (
                <button
                  type="button"
                  className="my-booking-modal-primary"
                  onClick={handleConfirmReschedule}
                  disabled={
                    actionLoading ||
                    availabilityLoading ||
                    !selectedTime
                  }
                >
                  {actionLoading ? "Rescheduling..." : "Confirm new time"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

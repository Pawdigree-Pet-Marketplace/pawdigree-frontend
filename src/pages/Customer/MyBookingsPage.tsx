
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
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchCustomerBookings,
  type BookingResponse,
  type BookingStatus,
} from "../../services/bookings/bookingApi";
import "./MyBookingsPage.css";

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
      return <CheckCircle2 size={16} />;

    case "declined":
    case "cancelled":
      return <XCircle size={16} />;

    case "completed":
      return <CheckCircle2 size={16} />;

    default:
      return null;
  }
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the customer's bookings when the page first opens.
  useEffect(() => {
    let cancelled = false;

    fetchCustomerBookings()
      .then((data) => {
        if (!cancelled) {
          setBookings(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
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

    // Prevent state updates if the page is unmounted.
    return () => {
      cancelled = true;
    };
  }, []);

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
            <p>View your upcoming and previous service bookings.</p>
          </div>

          {!loading && !error && (
            <span className="my-bookings-count">
              {bookings.length}{" "}
              {bookings.length === 1 ? "booking" : "bookings"}
            </span>
          )}
        </div>

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
                  {/* Service name and booking status */}
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
    </main>
  );
}

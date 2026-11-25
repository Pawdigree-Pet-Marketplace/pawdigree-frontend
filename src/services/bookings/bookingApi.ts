
import { apiRequest } from "../api";
import { customerAuthenticatedFetch } from "../customerAuthenticatedFetch";

// Available appointment times returned by the backend.
export interface FreeTimesResponse {
  service_id: number;
  date: string;
  duration: number;
  times: string[];
}

// Information sent when a customer confirms a booking.
export interface CreateBookingPayload {
  service: number;
  start_at: string;
  notes?: string;
}

// All possible booking statuses supported by the backend.
export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

// Booking information returned by the backend.
export interface BookingResponse {
  booking_id: number;
  service: number;
  service_name: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  status_display: string;
  notes: string;
  decision_reason: string;
  created_at: string;
}

// Fetch available appointment times.
// This endpoint is public, so guests can also use it.
export async function fetchServiceAvailableTimes(
  serviceId: number,
  date: string,
): Promise<FreeTimesResponse> {
  const params = new URLSearchParams({ date });

  return apiRequest<FreeTimesResponse>(
    `/bookings/services/${serviceId}/times/?${params.toString()}`,
  );
}

// Submit a booking.
// This endpoint requires an authenticated customer.
export async function createServiceBooking(
  payload: CreateBookingPayload,
): Promise<BookingResponse> {
  const response = await customerAuthenticatedFetch(
    "/api/bookings/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = data as Record<string, unknown> | null;

    const message = errors
      ? Object.entries(errors)
          .map(([field, value]) => {
            const readableValue = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${field}: ${readableValue}`;
          })
          .join("\n")
      : `Booking failed with status ${response.status}.`;

    throw new Error(message || "Unable to create your booking.");
  }

  return data as BookingResponse;
}

// Fetch all bookings belonging to the authenticated customer.
// This endpoint requires an authenticated customer.
export async function fetchCustomerBookings(): Promise<BookingResponse[]> {
  const response = await customerAuthenticatedFetch(
    "/api/bookings/customer/",
    {
      method: "GET",
    },
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = data as Record<string, unknown> | null;

    const message = errors
      ? Object.entries(errors)
          .map(([field, value]) => {
            const readableValue = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${field}: ${readableValue}`;
          })
          .join("\n")
      : `Unable to fetch bookings. Status: ${response.status}.`;

    throw new Error(message || "Unable to load your bookings.");
  }

  return data as BookingResponse[];
}

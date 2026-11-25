import API_BASE_URL from "../api";
import { vendorAuthenticatedFetch } from "../vendorAuthenticatedFetch";

export type VendorBookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export interface VendorBooking {
  booking_id: number;
  customer_id: number;
  customer_name: string;
  service_name: string;
  start_at: string;
  end_at: string;
  status: VendorBookingStatus;
  notes: string;
  decision_reason: string | null;
  created_at: string;
}

export type VendorBookingDecision = "accepted" | "declined" | "completed";

function vendorBookingUrl(path: string): string {
  return new URL(`/api/bookings/vendor/${path}`, API_BASE_URL || window.location.origin).toString();
}

async function errorMessage(response: Response): Promise<string> {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const fields = data as Record<string, unknown>;
    if (typeof fields.detail === "string") return fields.detail;
    return Object.entries(fields)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
      .join("\n");
  }
  return `Request failed (${response.status}). Please try again.`;
}

export async function fetchVendorBookings(): Promise<VendorBooking[]> {
  const response = await vendorAuthenticatedFetch(vendorBookingUrl(""));
  if (!response.ok) throw new Error(await errorMessage(response));
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("The server returned an unexpected bookings response.");
  return data as VendorBooking[];
}

export async function updateVendorBookingStatus(
  bookingId: number,
  status: VendorBookingDecision,
  decisionReason?: string,
): Promise<VendorBooking> {
  const response = await vendorAuthenticatedFetch(
    vendorBookingUrl(`${bookingId}/status/`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(status === "declined" ? { decision_reason: decisionReason ?? "" } : {}),
      }),
    },
  );
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as VendorBooking;
}

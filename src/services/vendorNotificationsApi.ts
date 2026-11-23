import API_BASE_URL from "./api";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";

export type VendorNotification = {
  notification_id: string | number;
  type: string;
  message: string;
  business_id?: string | number | null;
  business_name?: string | null;
  reference_type?: string | null;
  reference_id?: string | number | null;
  is_read: boolean;
  created_at: string;
};
type ListResponse = VendorNotification[] | { results?: VendorNotification[] };

const endpoint = `${API_BASE_URL.replace(/\/$/, "")}/api/notification`;
export async function getVendorNotifications(): Promise<VendorNotification[]> {
  const response = await vendorAuthenticatedFetch(`${endpoint}/`);
  if (!response.ok) throw new Error("Notifications could not be loaded.");
  const data = await response.json() as ListResponse;
  return Array.isArray(data) ? data : data.results ?? [];
}
export async function getVendorUnreadNotificationCount(): Promise<number> {
  const response = await vendorAuthenticatedFetch(`${endpoint}/unread-count/`);
  if (!response.ok) throw new Error("Unread notifications could not be loaded.");
  const data = await response.json() as { unread?: number };
  return Number(data.unread ?? 0);
}
export async function markVendorNotificationRead(id: string | number): Promise<void> {
  const response = await vendorAuthenticatedFetch(`${endpoint}/${encodeURIComponent(String(id))}/read/`, { method: "POST" });
  if (!response.ok) throw new Error("This notification could not be marked as read.");
}

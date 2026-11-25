import API_BASE_URL from "./api";
import { customerAuthenticatedFetch } from "./customerAuthenticatedFetch";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";

export type NotificationRole = "customer" | "vendor";

export type PawdigreeNotification = {
  notification_id: number;
  type: string;
  message: string;
  business_id: string | null;
  business_name: string | null;
  reference_type: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PawdigreeNotification[];
};

export type UnreadNotificationCount = {
  unread: number;
  by_business?: Record<string, number>;
};

const endpoint = `${API_BASE_URL.replace(/\/$/, "")}/api/notification/`;

function authenticatedFetch(role: NotificationRole) {
  return role === "vendor" ? vendorAuthenticatedFetch : customerAuthenticatedFetch;
}

function queryFor(role: NotificationRole, businessId?: string | null) {
  const query = new URLSearchParams();
  if (role === "vendor" && businessId) query.set("business", businessId);
  return query.size ? `?${query.toString()}` : "";
}

async function ensureOk(response: Response, fallback: string): Promise<void> {
  if (response.ok) return;
  if (response.status === 400) throw new Error("The notification request was invalid. Please refresh and try again.");
  if (response.status === 401) throw new Error("Your session has expired. Please sign in again.");
  if (response.status === 403 || response.status === 404) throw new Error("This notification is no longer available.");
  if (response.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
  throw new Error(fallback);
}

export async function getNotifications(
  role: NotificationRole,
  options: { businessId?: string | null; page?: number } = {},
): Promise<NotificationPage> {
  const query = new URLSearchParams();
  if (role === "vendor" && options.businessId) query.set("business", options.businessId);
  if (options.page && options.page > 1) query.set("page", String(options.page));
  const suffix = query.size ? `?${query.toString()}` : "";
  const response = await authenticatedFetch(role)(`${endpoint}${suffix}`);
  await ensureOk(response, "Notifications could not be loaded.");
  const data = await response.json() as NotificationPage;
  return {
    count: Number(data.count ?? 0),
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: Array.isArray(data.results) ? data.results : [],
  };
}

export async function getUnreadNotificationCount(
  role: NotificationRole,
  businessId?: string | null,
): Promise<UnreadNotificationCount> {
  const response = await authenticatedFetch(role)(`${endpoint}unread-count/${queryFor(role, businessId)}`);
  await ensureOk(response, "Unread notifications could not be loaded.");
  return await response.json() as UnreadNotificationCount;
}

export async function markNotificationRead(role: NotificationRole, id: number): Promise<void> {
  const response = await authenticatedFetch(role)(`${endpoint}${encodeURIComponent(String(id))}/read/`, { method: "POST" });
  await ensureOk(response, "This notification could not be marked as read.");
}

export async function markAllNotificationsRead(
  role: NotificationRole,
  businessId?: string | null,
): Promise<UnreadNotificationCount> {
  const response = await authenticatedFetch(role)(`${endpoint}mark-all-read/${queryFor(role, businessId)}`, { method: "POST" });
  await ensureOk(response, "Notifications could not be marked as read.");
  return await response.json() as UnreadNotificationCount;
}

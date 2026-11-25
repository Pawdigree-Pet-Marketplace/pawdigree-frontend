import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  type PawdigreeNotification,
} from "./notificationsApi";

export type VendorNotification = PawdigreeNotification;
export async function getVendorNotifications(): Promise<VendorNotification[]> {
  return (await getNotifications("vendor")).results;
}
export async function getVendorUnreadNotificationCount(): Promise<number> {
  return (await getUnreadNotificationCount("vendor")).unread;
}
export async function markVendorNotificationRead(id: string | number): Promise<void> {
  return markNotificationRead("vendor", Number(id));
}

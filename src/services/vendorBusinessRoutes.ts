export type VendorBusinessPage =
  | "dashboard"
  | "availability"
  | "services"
  | "profile"
  | "store-profile"
  | "listings"
  | "listings/new"
  | "adoption-applications"
  | "services/new"
  | "services/:serviceId/edit"
  | "services/:serviceId/availability"
  | "edit-pet/:petId"
  | "merchandise"
  | "documents";

export function vendorBusinessPath(businessId: string, page: string): string {
  return `/vendor/business/${encodeURIComponent(businessId)}/${page}`;
}

export function activeBusinessIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/vendor\/business\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

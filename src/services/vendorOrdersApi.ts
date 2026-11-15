
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";
import API_BASE_URL from "./api";

function vendorOrdersUrl(suffix = "") {
  const baseUrl = API_BASE_URL || window.location.origin;
  return new URL(`/api/orders/vendor/${suffix}`, baseUrl).toString();
}

export type VendorOrderStatus =
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface VendorOrderItem {
  id?: number;
  product?: number | string;
  product_name?: string;
  name?: string;
  quantity: number;
  price?: string | number;
  unit_price?: string | number;
  subtotal?: string | number;
}

export interface VendorOrder {
  id: number;
  order_id: number | string;
  business_name: string;
  status: VendorOrderStatus;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city_district: string;
  notes: string;
  items: VendorOrderItem[];
  total: string;
  created_at: string;
  updated_at: string;
}

export type VendorOrderFilter =
  | "ALL"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export async function fetchVendorOrders(
  status?: VendorOrderFilter,
): Promise<VendorOrder[]> {
  const query =
    status && status !== "ALL"
      ? `?status=${encodeURIComponent(status)}`
      : "";

  const response = await vendorAuthenticatedFetch(
    `${vendorOrdersUrl()}${query}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("The server returned an unexpected orders response.");
  }

  return data as VendorOrder[];
}

export async function updateVendorOrderStatus(
  vendorOrderId: number,
  status: VendorOrderStatus,
): Promise<VendorOrder> {
  const response = await vendorAuthenticatedFetch(
    vendorOrdersUrl(`${vendorOrderId}/status/`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as VendorOrder;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data === "string") return data;

    if (data.status) {
      const statusMessage = Array.isArray(data.status)
        ? data.status.join(" ")
        : String(data.status);

      return statusMessage;
    }

    if (data.detail) {
      return String(data.detail);
    }

    return Object.values(data)
      .flat()
      .map(String)
      .join(" ");
  } catch {
    return `Request failed (${response.status}). Please try again.`;
  }
}

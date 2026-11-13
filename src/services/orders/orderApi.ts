
import API_BASE_URL from "../api";
import { customerAuthenticatedFetch } from "../customerAuthenticatedFetch";

// A product purchased within a vendor order.
export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

// An order belonging to one vendor.
export interface VendorOrder {
  id: number;
  business_id: number;
  business_name: string;
  status: string;
  items: OrderItem[];
}

// A complete customer checkout.
export interface CustomerOrder {
  id: number;
  status: string;
  items_subtotal: string;
  total_amount: string;
  expires_at: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city_district: string;
  notes: string;
  created_at: string;
  vendor_orders: VendorOrder[];
}

export interface CheckoutPayload {
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city_district: string;
  notes?: string;
}

// Build the customer order history URL.
function getOrdersUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("The backend API URL is not configured.");
  }

  return new URL("/api/orders/my-orders/", API_BASE_URL).toString();
}

// Read and format backend errors.
async function getErrorMessage(response: Response): Promise<string> {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const errors = data as Record<string, unknown>;

    if (typeof errors.detail === "string") {
      return errors.detail;
    }

    return Object.entries(errors)
      .map(([field, value]) => {
        const message = Array.isArray(value)
          ? value.join(" ")
          : typeof value === "string"
            ? value
            : JSON.stringify(value);

        return `${field}: ${message}`;
      })
      .join("\n");
  }

  return `Unable to retrieve orders (${response.status}).`;
}

// GET /api/orders/my-orders/
export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  const response = await customerAuthenticatedFetch(getOrdersUrl());

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("The backend returned an invalid order history response.");
  }

  return data as CustomerOrder[];
}


// GET /api/orders/my-orders/<id>/
export async function getCustomerOrderById(
  orderId: number,
): Promise<CustomerOrder> {
  const orderUrl = new URL(
    `${orderId}/`,
    getOrdersUrl(),
  ).toString();

  const response = await customerAuthenticatedFetch(orderUrl);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== "object" ||
    !("id" in data)
  ) {
    throw new Error(
      "The backend returned an invalid order details response.",
    );
  }

  return data as CustomerOrder;
}


// Build the customer checkout URL.
function getCheckoutUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("The backend API URL is not configured.");
  }

  return new URL("/api/orders/checkout/", API_BASE_URL).toString();
}

// POST /api/orders/checkout/
export async function createCheckoutOrder(
  payload: CheckoutPayload,
): Promise<CustomerOrder> {
  const response = await customerAuthenticatedFetch(
    getCheckoutUrl(),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== "object" ||
    !("id" in data)
  ) {
    throw new Error(
      "The backend returned an invalid checkout response.",
    );
  }

  return data as CustomerOrder;
}

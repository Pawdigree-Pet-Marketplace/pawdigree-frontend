import API_BASE_URL from "../api";
import { customerAuthenticatedFetch } from "../customerAuthenticatedFetch";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUND_REQUIRED"
  | "REFUNDED";

export type SandboxPaymentResult = "success" | "failed";

export interface PaymentMethodsResponse {
  methods: string[];
  currency: string;
}

export interface Payment {
  id: number;
  order: number;
  order_status: string;
  order_expires_at: string | null;
  method: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  payment_url: string;
  paid_at: string | null;
  created_at: string;
}

function getPaymentsUrl(endpoint: string): string {
  if (!API_BASE_URL) {
    throw new Error("The backend API URL is not configured.");
  }

  return new URL(`/api/payments${endpoint}`, API_BASE_URL).toString();
}

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

  return `Payment request failed (${response.status}).`;
}

async function handlePaymentResponse(
  response: Response,
): Promise<Payment> {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== "object" ||
    !("id" in data) ||
    !("status" in data)
  ) {
    throw new Error("The backend returned an invalid payment response.");
  }

  return data as Payment;
}

// GET /api/payments/methods/
export async function getPaymentMethods(): Promise<PaymentMethodsResponse> {
  const response = await customerAuthenticatedFetch(
    getPaymentsUrl("/methods/"),
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== "object" ||
    !("methods" in data) ||
    !Array.isArray(data.methods) ||
    !("currency" in data)
  ) {
    throw new Error("The backend returned invalid payment methods.");
  }

  return data as PaymentMethodsResponse;
}

// POST /api/payments/start/
export async function startPayment(
  orderId: number,
  method: string,
): Promise<Payment> {
  const response = await customerAuthenticatedFetch(
    getPaymentsUrl("/start/"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        method,
      }),
    },
  );

  return handlePaymentResponse(response);
}

// GET /api/payments/orders/{order_id}/
export async function getPaymentStatus(
  orderId: number,
): Promise<Payment> {
  const response = await customerAuthenticatedFetch(
    getPaymentsUrl(`/orders/${orderId}/`),
  );

  return handlePaymentResponse(response);
}

// POST /api/payments/sandbox/simulate/
export async function simulateSandboxPayment(
  reference: string,
  result: SandboxPaymentResult,
): Promise<Payment> {
  const response = await customerAuthenticatedFetch(
    getPaymentsUrl("/sandbox/simulate/"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference,
        result,
      }),
    },
  );

  return handlePaymentResponse(response);
}

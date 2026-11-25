import API_BASE_URL from "./api";
import { customerAuthenticatedFetch } from "./customerAuthenticatedFetch";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";

export type AdoptionInfoMessage = {
  id: string | number;
  kind: "REQUEST" | "REPLY";
  body: string;
  created_at: string;
};

export class AdoptionMessagingError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AdoptionMessagingError";
  }
}

async function errorMessage(response: Response) {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const fields = Object.values(data as Record<string, unknown>)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === "string");
    if (fields.length) return fields.join(" ");
  }
  switch (response.status) {
    case 400: return "Please check your message and try again.";
    case 401: return "Your session has expired. Please sign in again.";
    case 403: return "You’re not allowed to message on this application.";
    case 404: return "This adoption application is no longer available.";
    case 429: return "Too many requests. Please wait a moment and try again.";
    default: return "Unable to send this message. Please try again.";
  }
}

async function sendInfoMessage(
  role: "customer" | "vendor",
  applicationId: string,
  action: "request-info" | "reply",
  message: string,
): Promise<void> {
  const authenticatedFetch = role === "vendor" ? vendorAuthenticatedFetch : customerAuthenticatedFetch;
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/adoptions/applications/${encodeURIComponent(applicationId)}/${action}/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    },
  );
  if (!response.ok) throw new AdoptionMessagingError(await errorMessage(response), response.status);
}

export function requestAdoptionInfo(applicationId: string, message: string) {
  return sendInfoMessage("vendor", applicationId, "request-info", message);
}

export function replyToAdoptionInfo(applicationId: string, message: string) {
  return sendInfoMessage("customer", applicationId, "reply", message);
}

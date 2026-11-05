
import API_BASE_URL from "./api";
import {
  getSessionToken,
  getSessionRole,
} from "./auth/authStorage";

export type DocumentType = "REGISTRATION" | "TAX" | "OTHER";

export interface VendorDocument {
  document_id: string;
  document_type: DocumentType;
  review_status: string;
  correction_reason?: string;
  version?: number;
  reviewed_at?: string;
  created_at?: string;
  download_url?: string;
}

export interface VendorBusiness {
  id: string;
  name: string;
  description?: string;
  contact?: string;
  email?: string;
  address?: string;
  city_district?: string;
  verification_status?: string;
  decision_reason?: string;
  vendor_response?: string;
  documents?: VendorDocument[];
}

function authHeaders(): HeadersInit {
  const token = getSessionToken();

  if (!token || getSessionRole() !== "VENDOR") {
    throw new Error("Please log in using your vendor account.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function checkResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data
        ? Object.entries(data)
            .map(([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(" ") : value}`
            )
            .join("\n")
        : `Request failed (${response.status}).`
    );
  }

  return data as T;
}

export async function getVendorBusinesses(): Promise<VendorBusiness[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/businesses/verification-status/`,
    { headers: authHeaders() }
  );

  const data = await checkResponse<
    VendorBusiness[] | { results: VendorBusiness[] }
  >(response);

  return Array.isArray(data) ? data : data.results ?? [];
}

export async function updateVendorBusiness(
  businessId: string,
  details: Partial<VendorBusiness>
): Promise<VendorBusiness> {
  const response = await fetch(
    `${API_BASE_URL}/api/businesses/${businessId}/`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(details),
    }
  );

  return checkResponse<VendorBusiness>(response);
}

export async function submitVendorResponse(
  businessId: string,
  vendorResponse: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/businesses/${businessId}/response/`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vendor_response: vendorResponse }),
    }
  );

  await checkResponse<unknown>(response);
}

export async function uploadVendorDocument(
  businessId: string,
  documentType: DocumentType,
  file: File
): Promise<VendorDocument> {
  const formData = new FormData();

  formData.append("business", businessId);
  formData.append("document_type", documentType);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/documents/`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  return checkResponse<VendorDocument>(response);
}

export async function resubmitVendorDocument(
  documentId: string,
  file: File
): Promise<VendorDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}/resubmit/`,
    {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    }
  );

  return checkResponse<VendorDocument>(response);
}

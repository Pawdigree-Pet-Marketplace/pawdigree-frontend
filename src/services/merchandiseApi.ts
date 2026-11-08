
import API_BASE_URL from "./api";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";
export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  display_order: number;
}

export interface Merchandise {
  id: number;
  business: string;
  category: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  images: ProductImage[];
}

export interface MerchandisePayload {
  business: string;
  category: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
}

type ProductResponse =
  | Merchandise[]
  | { results?: Merchandise[] };

const PRODUCTS_URL = `${API_BASE_URL}/api/products/`;

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await vendorAuthenticatedFetch(url, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body === "object"
        ? Object.values(body as Record<string, unknown>)
            .flat()
            .map(String)
            .join(" ")
        : "";

    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getMerchandise(): Promise<Merchandise[]> {
  const response = await request<ProductResponse>(PRODUCTS_URL);

  return Array.isArray(response) ? response : response.results ?? [];
}

export async function createMerchandise(
  payload: MerchandisePayload,
): Promise<Merchandise> {
  return request<Merchandise>(PRODUCTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateMerchandise(
  id: number,
  payload: Partial<MerchandisePayload>,
): Promise<Merchandise> {
  return request<Merchandise>(`${PRODUCTS_URL}${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deactivateMerchandise(
  id: number,
): Promise<void> {
  await request<void>(`${PRODUCTS_URL}${id}/`, {
    method: "DELETE",
  });
}

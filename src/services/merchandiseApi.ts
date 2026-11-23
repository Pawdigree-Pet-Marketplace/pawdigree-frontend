
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
  approved: boolean;
  rejection_reason: string;
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
    if (body && typeof body === "object" && "description" in body) {
      const value = (body as Record<string, unknown>).description;
      const detail = Array.isArray(value) ? value.join(" ") : String(value);
      throw new Error(`description: ${detail}`);
    }
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

export async function getMerchandise(businessId?: string): Promise<Merchandise[]> {
  const url = businessId
    ? `${PRODUCTS_URL}?business_id=${encodeURIComponent(businessId)}`
    : PRODUCTS_URL;
  const response = await request<ProductResponse>(url);

  const items = Array.isArray(response) ? response : response.results ?? [];
  return businessId ? items.filter((product) => String(product.business) === businessId) : items;
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
  businessId?: string,
): Promise<Merchandise> {
  const url = `${PRODUCTS_URL}${id}/${businessId ? `?business_id=${encodeURIComponent(businessId)}` : ""}`;
  return request<Merchandise>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function uploadMerchandiseImage(
  productId: number,
  file: File,
  altText: string,
  displayOrder: number,
): Promise<ProductImage> {
  const body = new FormData();
  body.append("image", file);
  body.append("alt_text", altText);
  body.append("display_order", String(displayOrder));

  return request<ProductImage>(`${PRODUCTS_URL}${productId}/images/`, {
    method: "POST",
    body,
  });
}

export async function deleteMerchandiseImage(
  productId: number,
  imageId: number,
): Promise<void> {
  await request<void>(`${PRODUCTS_URL}${productId}/images/${imageId}/`, {
    method: "DELETE",
  });
}

export async function deactivateMerchandise(
  id: number,
  businessId?: string,
): Promise<void> {
  await request<void>(`${PRODUCTS_URL}${id}/${businessId ? `?business_id=${encodeURIComponent(businessId)}` : ""}`, {
    method: "DELETE",
  });
}

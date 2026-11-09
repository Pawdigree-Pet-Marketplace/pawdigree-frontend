import { apiRequest } from "./api";
import {
  MERCH_PAGE_SIZE,
  type MerchCategory,
  type MerchQuery,
  type PagedProducts,
  type Product,
} from "../data/merchandise";

/** Public merchandise list (no login needed). Newest first. */
export async function fetchProducts(query: MerchQuery): Promise<PagedProducts> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(MERCH_PAGE_SIZE),
  });
  // Parameter names follow the backend's "Merchandise Search and Filtering API".
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.vendor) params.set("business_name", query.vendor);
  if (query.minPrice) params.set("price_min", query.minPrice);
  if (query.maxPrice) params.set("price_max", query.maxPrice);
  if (query.inStock) params.set("in_stock", "true");
  if (query.sort !== "newest") params.set("sort", query.sort);
  const res = await apiRequest<Product[] | PagedProducts>(
    `/products/public/?${params.toString()}`,
  );
  return Array.isArray(res) ? { count: res.length, results: res } : res;
}

/** Public details for one merchandise listing. */
export async function fetchProduct(id: string | number): Promise<Product> {
  return apiRequest<Product>(`/products/public/${encodeURIComponent(id)}/`);
}

/** Category list for the filter. Callers should treat a failure as "no categories". */
export async function fetchMerchCategories(): Promise<MerchCategory[]> {
  const res = await apiRequest<MerchCategory[] | { results?: MerchCategory[] }>(
    "/categories/",
  );
  return Array.isArray(res) ? res : (res.results ?? []);
}

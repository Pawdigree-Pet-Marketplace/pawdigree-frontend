import { apiRequest } from "./api";
import { getCategories } from "./categoryService";
import {
  SERVICE_PAGE_SIZE,
  type PagedServices,
  type Service,
} from "../data/services";

export interface ServiceQuery {
  search: string;
  category: string;
  cityDistrict: string;
  minPrice: string;
  maxPrice: string;
  page: number;
}

export async function fetchServices(
  query: ServiceQuery,
): Promise<PagedServices> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(SERVICE_PAGE_SIZE),
  });

  if (query.search.trim()) params.set("search", query.search.trim());
  if (query.category) params.set("category", query.category);
  if (query.cityDistrict.trim()) {
    params.set("city_district", query.cityDistrict.trim());
  }
  if (query.minPrice) params.set("min_price", query.minPrice);
  if (query.maxPrice) params.set("max_price", query.maxPrice);

  return apiRequest<PagedServices>(
    `/services/public/?${params.toString()}`,
  );
}

export { getCategories };
export type { Service };

import type { Suggestion, SuggestionResponse } from "../data/pets";
import API_BASE_URL, { apiRequest } from "./api";

const RESULT_LIMIT = 5;

type BusinessResult = {
  id: string;
  name: string;
  city_district?: string;
  categories?: string[];
  logo?: string | null;
  cover_image?: string | null;
};

type PetResult = {
  pet_id: number;
  name: string;
  species?: string;
  breed?: string;
  business_name?: string;
  images?: { image?: string | null; is_primary?: boolean }[];
};

type ProductResult = {
  id: number;
  name: string;
  price?: number | string | null;
  business_name?: string | null;
  main_image?: string | null;
};

type ServiceResult = {
  service_id: number;
  name: string;
  service_type?: string;
  business_name?: string;
  image?: string | null;
};

type ListResponse<T> = T[] | { results?: T[] };

function rows<T>(response: ListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return Array.isArray(response.results) ? response.results : [];
}

function absoluteImage(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  if (!API_BASE_URL) return path;
  try {
    return new URL(path, API_BASE_URL).href;
  } catch {
    return path;
  }
}

function priceLabel(value?: string | number | null): string | undefined {
  if (value == null || value === "") return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) ? `UGX ${amount.toLocaleString("en-UG")}` : undefined;
}

function suggestionsFor<T>(
  kind: Suggestion["kind"],
  values: T[],
  map: (value: T) => Suggestion,
): Suggestion[] {
  return values.slice(0, RESULT_LIMIT).map(map).filter((item) => item.label && item.href && item.kind === kind);
}

/** Search the four existing public list APIs. A failed resource is omitted when other APIs succeed. */
export async function fetchGlobalSuggestions(query: string, signal?: AbortSignal): Promise<SuggestionResponse> {
  const term = query.trim();
  if (term.length < 2) return { suggestions: [] };

  const encoded = encodeURIComponent(term);
  const pageLimit = `&page_size=${RESULT_LIMIT}`;
  const results = await Promise.allSettled([
    apiRequest<ListResponse<BusinessResult>>(`/businesses/public/?search=${encoded}`, { signal }),
    apiRequest<ListResponse<PetResult>>(`/pets/public/?search=${encoded}${pageLimit}`, { signal }),
    apiRequest<ListResponse<ProductResult>>(`/products/public/?search=${encoded}${pageLimit}`, { signal }),
    apiRequest<ListResponse<ServiceResult>>(`/services/public/?search=${encoded}${pageLimit}`, { signal }),
  ]);

  if (signal?.aborted) return { suggestions: [] };
  const [businesses, pets, products, services] = results;
  if (results.every((result) => result.status === "rejected")) {
    throw new Error("Marketplace suggestions are temporarily unavailable. Please try again.");
  }

  const output: Suggestion[] = [];
  if (businesses.status === "fulfilled") {
    output.push(...suggestionsFor("business", rows(businesses.value), (item) => ({
      kind: "business",
      label: item.name,
      hint: [item.city_district, item.categories?.slice(0, 2).join(", ")].filter(Boolean).join(" · ") || "Business",
      image: absoluteImage(item.logo || item.cover_image),
      href: `/vendors/${encodeURIComponent(item.id)}`,
    })));
  }
  if (pets.status === "fulfilled") {
    output.push(...suggestionsFor("pet", rows(pets.value), (item) => ({
      kind: "pet",
      label: item.name,
      hint: [item.breed || item.species, item.business_name].filter(Boolean).join(" · ") || "Pet listing",
      image: absoluteImage(item.images?.find((image) => image.is_primary)?.image || item.images?.[0]?.image),
      href: `/pets/${item.pet_id}`,
    })));
  }
  if (products.status === "fulfilled") {
    output.push(...suggestionsFor("product", rows(products.value), (item) => ({
      kind: "product",
      label: item.name,
      hint: [item.business_name, priceLabel(item.price)].filter(Boolean).join(" · ") || "Product",
      image: absoluteImage(item.main_image),
      href: `/merchandise/${item.id}`,
    })));
  }
  if (services.status === "fulfilled") {
    output.push(...suggestionsFor("service", rows(services.value), (item) => ({
      kind: "service",
      label: item.name,
      hint: [item.service_type, item.business_name].filter(Boolean).join(" · ") || "Service",
      image: absoluteImage(item.image),
      href: `/services/${item.service_id}`,
    })));
  }
  const failedCount = results.filter((result) => result.status === "rejected").length;
  return {
    suggestions: output,
    warning: failedCount > 0 ? "Some marketplace categories couldn’t be loaded." : undefined,
  };
}

/** One product from GET /api/products/public/ */
export interface Product {
  id: number;
  name: string;
  price: string | number | null;
  category: number | null;
  category_name: string | null;
  /** false when the product is out of stock (it is still listed). */
  is_available: boolean;
  business_name: string | null;
  /** Full image URL, or null when the vendor has not uploaded one. */
  main_image: string | null;
  /** Present on GET /api/products/public/{id}/. */
  description?: string;
  images?: ProductImage[];
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  display_order: number;
}

export interface PagedProducts {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: Product[];
}

export interface MerchCategory {
  id: number;
  name: string;
}

export const MERCH_PAGE_SIZE = 12;

export type MerchSort = "newest" | "price_asc" | "price_desc";

export const MERCH_SORT_OPTIONS: { value: MerchSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/** Everything the sidebar edits. */
export interface MerchFilterValues {
  category: string;
  /** Business name to search for. */
  vendor: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: MerchSort;
}

/** Everything that decides which products are shown. Mirrors the URL. */
export interface MerchQuery extends MerchFilterValues {
  page: number;
  search: string;
}

const SORTS = MERCH_SORT_OPTIONS.map((o) => o.value);

export function readMerchQuery(params: URLSearchParams): MerchQuery {
  const sort = params.get("sort") as MerchSort;
  return {
    page: Math.max(1, Number(params.get("page")) || 1),
    search: params.get("search")?.trim() ?? "",
    category: params.get("category") ?? "",
    vendor: params.get("vendor")?.trim() ?? "",
    minPrice: params.get("min_price") ?? "",
    maxPrice: params.get("max_price") ?? "",
    inStock: params.get("in_stock") === "1",
    sort: SORTS.includes(sort) ? sort : "newest",
  };
}

export function writeMerchQuery(q: MerchQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.page > 1) p.set("page", String(q.page));
  if (q.search) p.set("search", q.search);
  if (q.category) p.set("category", q.category);
  if (q.vendor) p.set("vendor", q.vendor);
  if (q.minPrice) p.set("min_price", q.minPrice);
  if (q.maxPrice) p.set("max_price", q.maxPrice);
  if (q.inStock) p.set("in_stock", "1");
  if (q.sort !== "newest") p.set("sort", q.sort);
  return p;
}


import { apiRequest } from './api';

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  kind?: CategoryKind | "general";
  is_active: boolean;
};

export type CategoryKind = "pets" | "merchandise" | "services";

const BUSINESS_CATEGORY_KIND: Record<string, CategoryKind> = {
  PET_SALE_ADOPTION: "pets",
  PRODUCT_SELLER: "merchandise",
  SERVICE_PROVIDER: "services",
};

export function categoryKindForBusinessType(
  businessType?: string | null,
): CategoryKind | null {
  return businessType ? BUSINESS_CATEGORY_KIND[businessType] ?? null : null;
}

type CategoryListResponse =
  | Category[]
  | {
      results: Category[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

export async function getCategories(kind?: CategoryKind): Promise<Category[]> {
  const path = kind
    ? `/categories/public/?kind=${encodeURIComponent(kind)}`
    : "/categories/";
  const response = await apiRequest<CategoryListResponse>(path);

  const categories = Array.isArray(response)
    ? response
    : response.results;

  return categories.filter(
    (category) =>
      category.is_active && (!kind || category.kind === kind),
  );
}

export async function saveBusinessCategories(
  businessId: string,
  categoryIds: number[],
): Promise<void> {
  if (!businessId.trim()) {
    throw new Error('Business ID is required.');
  }

  await apiRequest(
    `/businesses/${encodeURIComponent(businessId)}/categories/`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        category_ids: categoryIds,
      }),
    },
  );
}

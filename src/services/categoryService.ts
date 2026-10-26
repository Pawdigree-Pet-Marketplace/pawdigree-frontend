
import { apiRequest } from './api';

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
};

type CategoryListResponse =
  | Category[]
  | {
      results: Category[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

export async function getCategories(): Promise<Category[]> {
  const response = await apiRequest<CategoryListResponse>(
    '/categories/',
  );

  const categories = Array.isArray(response)
    ? response
    : response.results;

  return categories.filter((category) => category.is_active);
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

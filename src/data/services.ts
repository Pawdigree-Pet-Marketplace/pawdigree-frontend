export interface Service {
  service_id: number;
  name: string;
  service_type: string;
  description: string;
  price: string;
  duration: number;
  availability_status: string;
  category_name: string;
  business_name: string;
  city_district: string;
  image: string | null;
  average_rating: number;
  review_count: number;
}

export interface PagedServices {
  count: number;
  next: string | null;
  previous: string | null;
  results: Service[];
}

export const SERVICE_PAGE_SIZE = 12;

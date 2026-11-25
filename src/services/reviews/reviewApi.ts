
import { apiRequest } from "../api";
import { customerAuthenticatedFetch } from "../customerAuthenticatedFetch";

// The three types of items customers can review.
export type ReviewKind = "pet" | "product" | "service";

// A review returned by the backend.
export interface Review {
  id: number;
  kind: ReviewKind;
  target_id: number;
  rating: number;
  comment: string;
  reviewer: string;
  created_at: string;
  updated_at: string;
}

// Average rating and total number of visible reviews.
export interface RatingSummary {
  average_rating: number | null;
  review_count: number;
}

// Public reviews response, including pagination information.
export interface ReviewListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Review[];
  summary: RatingSummary;
}

// Result of checking whether a customer can review an item.
export interface ReviewEligibility {
  can_review: boolean;
  reason: string;
}

// Information sent when creating a review.
export interface CreateReviewPayload {
  kind: ReviewKind;
  target_id: number;
  rating: number;
  comment?: string;
}

// Read backend responses and return useful error messages.
async function readReviewResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    let message = fallbackMessage;

    if (data && typeof data === "object") {
      const errors = data as Record<string, unknown>;

      if (typeof errors.detail === "string") {
        message = errors.detail;
      } else {
        const messages = Object.entries(errors).map(([field, value]) => {
          const readableValue = Array.isArray(value)
            ? value.map(String).join(" ")
            : typeof value === "string"
              ? value
              : JSON.stringify(value);

          return `${field}: ${readableValue}`;
        });

        if (messages.length > 0) {
          message = messages.join("\n");
        }
      }
    }

    throw new Error(message);
  }

  return data as T;
}

// Public: GET /api/reviews/{kind}/{id}/
// Fetch reviews for a particular pet, product or service.
export async function fetchItemReviews(
  kind: ReviewKind,
  targetId: number,
): Promise<ReviewListResponse> {
  return apiRequest<ReviewListResponse>(
    `/reviews/${kind}/${targetId}/`,
  );
}

// Authenticated: GET /api/reviews/can-review/?kind=...&id=...
// Check whether the signed-in customer is eligible to review an item.
export async function checkReviewEligibility(
  kind: ReviewKind,
  targetId: number,
): Promise<ReviewEligibility> {
  const params = new URLSearchParams({
    kind,
    id: String(targetId),
  });

  const response = await customerAuthenticatedFetch(
    `/api/reviews/can-review/?${params.toString()}`,
  );

  return readReviewResponse<ReviewEligibility>(
    response,
    "Unable to check your review eligibility.",
  );
}

// Authenticated: POST /api/reviews/
// Submit a review for a pet, product or service.
export async function submitReview(
  payload: CreateReviewPayload,
): Promise<Review> {
  const response = await customerAuthenticatedFetch("/api/reviews/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readReviewResponse<Review>(
    response,
    "Unable to submit your review.",
  );
}

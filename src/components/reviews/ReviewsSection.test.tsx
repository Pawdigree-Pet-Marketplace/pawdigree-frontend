
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReviewsSection from "./ReviewsSection";
import { getSessionRole } from "../../services/auth/authStorage";
import {
  checkReviewEligibility,
  fetchItemReviews,
  submitReview,
} from "../../services/reviews/reviewApi";

vi.mock("../../services/auth/authStorage", () => ({
  getSessionRole: vi.fn(),
}));

vi.mock("../../services/reviews/reviewApi", () => ({
  checkReviewEligibility: vi.fn(),
  fetchItemReviews: vi.fn(),
  submitReview: vi.fn(),
}));

const mockReview = {
  id: 31,
  kind: "product" as const,
  target_id: 12,
  rating: 5,
  comment: "Excellent quality and value.",
  reviewer: "Jane D.",
  created_at: "2026-11-25T10:00:00Z",
  updated_at: "2026-11-25T10:00:00Z",
};

const mockReviewPage = {
  count: 1,
  next: null,
  previous: null,
  results: [mockReview],
  summary: {
    average_rating: 5,
    review_count: 1,
  },
};

function renderReviews() {
  return render(
    <MemoryRouter>
      <ReviewsSection kind="product" targetId={12} />
    </MemoryRouter>,
  );
}

describe("ReviewsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getSessionRole).mockReturnValue("CUSTOMER");

    vi.mocked(fetchItemReviews).mockResolvedValue(mockReviewPage);

    vi.mocked(checkReviewEligibility).mockResolvedValue({
      can_review: true,
      reason: "",
    });

    vi.mocked(submitReview).mockResolvedValue(mockReview);
  });

  it("displays public reviews and the rating summary", async () => {
    renderReviews();

    expect(
      await screen.findByText("Excellent quality and value."),
    ).toBeInTheDocument();

    expect(screen.getByText("Jane D.")).toBeInTheDocument();
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.getByText("Customer reviews (1)")).toBeInTheDocument();

    expect(fetchItemReviews).toHaveBeenCalledWith("product", 12);
  });

  it("shows the review form when the customer is eligible", async () => {
    renderReviews();

    expect(
      await screen.findByRole("button", { name: "Submit review" }),
    ).toBeInTheDocument();

    expect(checkReviewEligibility).toHaveBeenCalledWith("product", 12);
  });

  it("shows the backend eligibility reason when the customer cannot review", async () => {
    vi.mocked(checkReviewEligibility).mockResolvedValue({
      can_review: false,
      reason: "You can review a product after it has been delivered to you.",
    });

    renderReviews();

    expect(
      await screen.findByText(
        "You can review a product after it has been delivered to you.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Submit review" }),
    ).not.toBeInTheDocument();
  });

  it("asks guests to sign in before reviewing", async () => {
    vi.mocked(getSessionRole).mockReturnValue(null);

    renderReviews();

    expect(
      await screen.findByRole("link", { name: "Sign in to review" }),
    ).toHaveAttribute("href", "/login");

    expect(checkReviewEligibility).not.toHaveBeenCalled();
  });

  it("requires a star rating before submitting", async () => {
    renderReviews();

    fireEvent.click(
      await screen.findByRole("button", { name: "Submit review" }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Please select a star rating before submitting.");

    expect(submitReview).not.toHaveBeenCalled();
  });

  it("allows an eligible customer to submit a rating and comment", async () => {
    renderReviews();

    fireEvent.click(
      await screen.findByRole("button", { name: "Rate 5 stars" }),
    );

    fireEvent.change(screen.getByLabelText(/Your review/), {
      target: { value: "Excellent quality and value." },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Submit review" }),
    );

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith({
        kind: "product",
        target_id: 12,
        rating: 5,
        comment: "Excellent quality and value.",
      });
    });

    expect(
      await screen.findByText(
        "Your review has been submitted successfully.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "You have already reviewed this item. Thank you for sharing your experience.",
      ),
    ).toBeInTheDocument();
  });
});

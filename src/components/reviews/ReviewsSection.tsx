
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Star } from "lucide-react";

import { getSessionRole } from "../../services/auth/authStorage";
import {
  checkReviewEligibility,
  fetchItemReviews,
  submitReview,
  type RatingSummary,
  type Review,
  type ReviewEligibility,
  type ReviewKind,
} from "../../services/reviews/reviewApi";

import "./ReviewsSection.css";

interface ReviewsSectionProps {
  kind: ReviewKind;
  targetId: number;
}

const MAX_REVIEW_WORDS = 300;

const EMPTY_SUMMARY: RatingSummary = {
  average_rating: null,
  review_count: 0,
};

// Count words separated by whitespace.
function countWords(value: string): number {
  return value.trim()
    ? value.trim().split(/\s+/).length
    : 0;
}

function formatReviewDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function ReviewStars({
  rating,
}: {
  rating: number;
}) {
  return (
    <span
      className="reviews-stars"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={17}
          aria-hidden="true"
          className={value <= rating ? "is-filled" : ""}
          fill={value <= rating ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export default function ReviewsSection({
  kind,
  targetId,
}: ReviewsSectionProps) {
  const location = useLocation();

  // Public reviews and rating summary.
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] =
    useState<RatingSummary>(EMPTY_SUMMARY);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // Customer eligibility.
  const [isCustomer, setIsCustomer] = useState<boolean | null>(null);
  const [eligibility, setEligibility] =
    useState<ReviewEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState("");

  // Review form.
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Current number of words in the review comment.
  const commentWordCount = countWords(comment);

  // Enforce the 300-word limit, including pasted text.
  function handleCommentChange(value: string) {
    const words = value.trim().split(/\s+/).filter(Boolean);

    if (words.length > MAX_REVIEW_WORDS) {
      setComment(words.slice(0, MAX_REVIEW_WORDS).join(" "));
    } else {
      setComment(value);
    }
  }

  // Fetch the public reviews whenever the item changes.
  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoadingReviews(true);
      setReviewsError("");

      try {
        const data = await fetchItemReviews(kind, targetId);

        if (cancelled) return;

        setReviews(data.results);
        setSummary(data.summary ?? EMPTY_SUMMARY);
      } catch (error) {
        if (!cancelled) {
          setReviewsError(
            error instanceof Error
              ? error.message
              : "Unable to load reviews. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingReviews(false);
        }
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [kind, targetId, reloadCount]);

  // Check whether the signed-in customer can review this item.
  useEffect(() => {
    let cancelled = false;

    async function loadEligibility() {
      const customer = getSessionRole() === "CUSTOMER";

      setIsCustomer(customer);

      if (!customer) {
        setEligibility(null);
        setEligibilityError("");
        setEligibilityLoading(false);
        return;
      }

      setEligibilityLoading(true);
      setEligibilityError("");

      try {
        const result = await checkReviewEligibility(kind, targetId);

        if (!cancelled) {
          setEligibility(result);
        }
      } catch (error) {
        if (!cancelled) {
          setEligibilityError(
            error instanceof Error
              ? error.message
              : "Unable to check your review eligibility.",
          );
        }
      } finally {
        if (!cancelled) {
          setEligibilityLoading(false);
        }
      }
    }

    void loadEligibility();

    return () => {
      cancelled = true;
    };
  }, [kind, targetId]);

  // Submit the customer's review.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (rating < 1 || rating > 5) {
      setFormError("Please select a star rating before submitting.");
      return;
    }

    if (commentWordCount > MAX_REVIEW_WORDS) {
      setFormError(
        `Your review cannot exceed ${MAX_REVIEW_WORDS} words.`,
      );
      return;
    }

    if (!eligibility?.can_review || submitting) {
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const newReview = await submitReview({
        kind,
        target_id: targetId,
        rating,
        comment: comment.trim(),
      });

      // Add the new review to the displayed list.
      setReviews((current) => [newReview, ...current]);

      // Update the average rating and review count.
      setSummary((current) => {
        const newCount = current.review_count + 1;
        const previousTotal =
          (current.average_rating ?? 0) * current.review_count;
        const newAverage =
          (previousTotal + newReview.rating) / newCount;

        return {
          average_rating: Number(newAverage.toFixed(1)),
          review_count: newCount,
        };
      });

      // The backend allows only one review per customer per item.
      setEligibility({
        can_review: false,
        reason:
          "You have already reviewed this item. Thank you for sharing your experience.",
      });

      setRating(0);
      setComment("");
      setSuccessMessage("Your review has been submitted successfully.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We could not submit your review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="reviews-section"
      aria-labelledby={`reviews-heading-${kind}-${targetId}`}
    >
      {/* Section heading and rating summary */}
      <div className="reviews-section-heading">
        <div>
          <p className="reviews-eyebrow">CUSTOMER EXPERIENCES</p>

          <h2 id={`reviews-heading-${kind}-${targetId}`}>
            Ratings &amp; Reviews
          </h2>

          <p className="reviews-intro">
            Read experiences shared by other Pawdigree customers.
          </p>
        </div>

        <div className="reviews-summary" aria-label="Review summary">
          <div className="reviews-summary-score">
            <Star size={21} fill="currentColor" aria-hidden="true" />

            <strong>
              {summary.average_rating === null
                ? "—"
                : summary.average_rating.toFixed(1)}
            </strong>

            <span>/ 5</span>
          </div>

          <span className="reviews-summary-count">
            {summary.review_count}{" "}
            {summary.review_count === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      <div className="reviews-content">
        {/* Customer review list */}
        <div className="reviews-list-column">
          <h3 className="reviews-list-heading">
            Customer reviews ({summary.review_count})
          </h3>

          {loadingReviews ? (
            <p className="reviews-message" role="status">
              Loading reviews...
            </p>
          ) : reviewsError ? (
            <div
              className="reviews-message reviews-message-error"
              role="alert"
            >
              <p>{reviewsError}</p>

              <button
                type="button"
                onClick={() => setReloadCount((current) => current + 1)}
              >
                Try again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="reviews-empty">
              <MessageSquare size={28} aria-hidden="true" />
              <strong>No reviews yet</strong>
              <p>Be the first customer to share an experience.</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-card-top">
                    <div>
                      <strong className="reviewer-name">
                        {review.reviewer || "Customer"}
                      </strong>

                      <span className="review-date">
                        {formatReviewDate(review.created_at)}
                      </span>
                    </div>

                    <ReviewStars rating={review.rating} />
                  </div>

                  {review.comment && (
                    <p className="review-comment">{review.comment}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Customer review form */}
        <aside className="reviews-form-column">
          <h3>Share your experience</h3>

          {isCustomer === null || eligibilityLoading ? (
            <p className="reviews-message" role="status">
              Checking review eligibility...
            </p>
          ) : !isCustomer ? (
            <div className="reviews-eligibility-message">
              <p>
                Sign in with a customer account to review this item
                after completing your purchase, service booking, or
                adoption.
              </p>

              <Link
                to="/login"
                state={{
                  from: {
                    pathname: location.pathname,
                    search: location.search,
                  },
                }}
                className="reviews-login-link"
              >
                Sign in to review
              </Link>
            </div>
          ) : eligibilityError ? (
            <p
              className="reviews-message reviews-message-error"
              role="alert"
            >
              {eligibilityError}
            </p>
          ) : eligibility?.can_review ? (
            <form className="review-form" onSubmit={handleSubmit}>
              <fieldset className="review-rating-field">
                <legend>Your rating</legend>

                <div className="review-rating-options">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`review-rating-button ${
                        value <= rating ? "is-selected" : ""
                      }`}
                      aria-label={`Rate ${value} ${
                        value === 1 ? "star" : "stars"
                      }`}
                      aria-pressed={rating === value}
                      onClick={() => {
                        setRating(value);
                        setFormError("");
                      }}
                    >
                      <Star
                        size={30}
                        fill={value <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>

                <span className="review-rating-hint">
                  {rating === 0
                    ? "Select a rating from 1 to 5 stars."
                    : `${rating} out of 5 stars selected.`}
                </span>
              </fieldset>

              <label
                className="review-comment-label"
                htmlFor={`review-comment-${kind}-${targetId}`}
              >
                Your review <span>(Optional)</span>
              </label>

              <textarea
                id={`review-comment-${kind}-${targetId}`}
                value={comment}
                onChange={(event) => handleCommentChange(event.target.value)}
                placeholder="Tell other customers about your experience..."
                rows={5}
              />

              <span className="review-character-count" aria-live="polite">
                {commentWordCount}/{MAX_REVIEW_WORDS} words
              </span>

              {formError && (
                <p className="review-form-error" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="review-submit-button"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </form>
          ) : (
            <div className="reviews-eligibility-message" role="status">
              <p>
                {eligibility?.reason ||
                  "You are not currently eligible to review this item."}
              </p>
            </div>
          )}

          {successMessage && (
            <p className="review-form-success" role="status">
              {successMessage}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

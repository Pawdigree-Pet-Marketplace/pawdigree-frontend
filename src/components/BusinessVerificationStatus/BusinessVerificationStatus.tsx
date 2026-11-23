
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Clock,
  FileWarning,
} from "lucide-react";
import { apiRequest } from "../../services/api";
import "./BusinessVerificationStatus.css";

interface BusinessVerification {
  id: string;
  name: string;
  verification_status: string;
  decision_reason: string | null;
  reviewed_at: string | null;
  is_active: boolean;
  can_sell: boolean;
  categories?: Array<{ category_id: number; name: string; approval_status: string; can_sell: boolean }>;
}

interface ApiResponse {
  results?: BusinessVerification[];
}

type LoadState = "loading" | "success" | "error";

function normalizeStatus(status: string): string {
  return status.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function getStatusLabel(status: string): string {
  const normalized = normalizeStatus(status);

  const labels: Record<string, string> = {
    pending: "Pending review",
    approved: "Approved",
    verified: "Verified",
    rejected: "Rejected",
    changes_requested: "Changes requested",
    suspended: "Suspended",
    draft: "Draft",
  };

  return (
    labels[normalized] ??
    normalized.replace(/_/g, " ").replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    )
  );
}

function getStatusClass(status: string): string {
  const normalized = normalizeStatus(status);

  if (normalized === "approved" || normalized === "verified") {
    return "approved";
  }

  if (normalized === "rejected" || normalized === "suspended") {
    return "rejected";
  }

  if (normalized === "changes_requested") {
    return "changes-requested";
  }

  if (normalized === "draft") {
    return "draft";
  }

  return "pending";
}

function getStoredToken(): string | null {
  const possibleTokens = [
    localStorage.getItem("token"),
    sessionStorage.getItem("token"),
    localStorage.getItem("access"),
    localStorage.getItem("access_token"),
  ];

  return (
    possibleTokens.find(
      (token) =>
        typeof token === "string" &&
        token.trim() !== "" &&
        token !== "undefined" &&
        token !== "null",
    ) ?? null
  );
}

export default function BusinessVerificationStatus({ businessId }: { businessId?: string }) {
  const [businesses, setBusinesses] = useState<BusinessVerification[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadVerification() {
      const token = getStoredToken();

      if (!token) {
        console.error(
          "Business verification: no valid authentication token was found.",
        );
        setLoadState("error");
        return;
      }

      try {
        const data = await apiRequest<
          BusinessVerification[] | ApiResponse
        >(`/businesses/verification-status/${businessId ? `?business_id=${encodeURIComponent(businessId)}` : ""}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const allResults = Array.isArray(data) ? data : data.results ?? [];
        const results = businessId ? allResults.filter((business) => String(business.id) === businessId) : allResults;

        if (!Array.isArray(results)) {
          throw new Error("Unexpected verification response.");
        }

        if (!controller.signal.aborted) {
          setBusinesses(results);
          setLoadState("success");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            "Business verification request failed:",
            error,
          );
          setLoadState("error");
        }
      }
    }

    void loadVerification();

    return () => controller.abort();
  }, [businessId]);

  if (loadState === "loading") {
    return (
      <section
        className="verification-card"
        aria-label="Business verification status"
        aria-busy="true"
      >
        <div className="verification-card__heading">
          <Clock size={22} aria-hidden="true" />
          <div>
            <h2>Business verification</h2>
            <p>Checking your application status...</p>
          </div>
        </div>
      </section>
    );
  }

  if (loadState === "error") {
    return (
      <section
        className="verification-card"
        aria-label="Business verification status"
        role="status"
      >
        <div className="verification-card__heading">
          <FileWarning size={22} aria-hidden="true" />
          <div>
            <h2>Business verification</h2>
            <p>
              We couldn't load your verification status. Please log in again
              if your session has expired, then try refreshing the page.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section
        className="verification-card"
        aria-label="Business verification status"
      >
        <div className="verification-card__heading">
          <Clock size={22} aria-hidden="true" />
          <div>
            <h2>Business verification</h2>
            <p>
              You haven't registered a business yet. Register your business
              and submit the required documents for admin review.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="verification-list">
      {businesses.map((business) => {
        const status = normalizeStatus(business.verification_status);
        const decisionReason = business.decision_reason?.trim();
        const needsAttention =
          status === "rejected" || status === "changes_requested";

        return (
          <section
            className="verification-card"
            aria-label={`${business.name} verification status`}
            key={business.id}
          >
            <div className="verification-card__heading">
              <BadgeCheck size={22} aria-hidden="true" />
              <div>
                <h2>{business.name}</h2>
                <p>Business verification</p>
              </div>
            </div>

            <div className="verification-card__status">
              <span
                className={`verification-status-badge verification-status-badge--${getStatusClass(status)}`}
              >
                {getStatusLabel(status)}
              </span>
            </div>

            {business.reviewed_at && (
              <p className="verification-card__date">
                Reviewed on:{" "}
                {new Date(business.reviewed_at).toLocaleDateString()}
              </p>
            )}

            {needsAttention && (
              <div className="verification-card__reason" role="alert">
                <strong>
                  {status === "rejected"
                    ? "Reason for rejection"
                    : "Changes requested"}
                </strong>
                <p>
                  {decisionReason ||
                    "Please contact support for more information."}
                </p>
              </div>
            )}

            {status === "approved" && (
              <p className="verification-card__message">
                {!business.is_active
                  ? "Your business is approved, but currently inactive. Contact Pawdigree support if you need it reactivated."
                  : business.can_sell
                    ? "Your business is approved and active for selling."
                    : business.categories?.some((category) => normalizeStatus(category.approval_status) === "pending")
                      ? "Your business is approved and active. Selling is waiting for admin approval of your requested categories."
                      : "Your business is approved and active, but no selling category is currently approved. Review your category requests or contact support."}
              </p>
            )}

            {status === "pending" && (
              <p className="verification-card__message">
                Your application is awaiting admin review.
              </p>
            )}

            {status === "draft" && (
              <p className="verification-card__message">
                Your business registration is still a draft.
              </p>
            )}

            {status === "suspended" && (
              <p className="verification-card__message">
                Your business is currently suspended. Please contact support
                for assistance.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}


import { useEffect, useState } from "react";
import { BadgeCheck, Clock, FileWarning, RefreshCw } from "lucide-react";
import API_BASE_URL from "../../services/api";
import "./BusinessVerificationStatus.css";

interface BusinessVerification {
  id: string;
  name: string;
  verification_status: string;
  decision_reason: string | null;
  reviewed_at: string | null;
  is_active: boolean;
  can_sell: boolean;
}

interface ApiResponse {
  results?: BusinessVerification[];
}

type LoadState = "loading" | "success" | "error";

function getStatusLabel(status: string) {
  const normalized = status.toLowerCase().replace(/[\s-]+/g, "_");

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
    normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase().replace(/[\s-]+/g, "_");

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

export default function BusinessVerificationStatus() {
  const [businesses, setBusinesses] = useState<BusinessVerification[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadVerification() {
      const token =
        localStorage.getItem("access") ||
        localStorage.getItem("access_token");

      if (!token) {
        setLoadState("error");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/businesses/verification-status/`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Unable to load verification status.");
        }

        const data: BusinessVerification[] | ApiResponse =
          await response.json();

        const results = Array.isArray(data) ? data : data.results;

        if (!Array.isArray(results)) {
          throw new Error("Unexpected verification response.");
        }

        if (!controller.signal.aborted) {
          setBusinesses(results);
          setLoadState("success");
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadState("error");
        }
      }
    }

    void loadVerification();

    return () => controller.abort();
  }, []);

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
      >
        <div className="verification-card__heading">
          <FileWarning size={22} aria-hidden="true" />
          <div>
            <h2>Business verification</h2>
            <p>
              We couldn't load your verification status. Please try again
              later.
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
            <p>You haven't registered a business yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="verification-list">
      {businesses.map((business) => {
        const status = business.verification_status;
        const isRejected = status.toLowerCase() === "rejected";

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

            {isRejected && (
              <div className="verification-card__reason" role="alert">
                <div className="verification-card__reason-heading">
                  <RefreshCw size={18} aria-hidden="true" />
                  <strong>Application rejected</strong>
                </div>

                <p>
                  {business.decision_reason ||
                    "No rejection reason was provided. Please contact support for clarification."}
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

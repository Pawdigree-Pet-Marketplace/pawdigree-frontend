
import { useEffect, useState } from "react";
import { BadgeCheck, Clock, FileWarning, RefreshCw } from "lucide-react";
import API_BASE_URL from "../../services/api";
import "./BusinessVerificationStatus.css";

interface VerificationResponse {
  status?: string;
  last_verified?: string;
  rejection_reason?: string;
  reason?: string;
  review_notes?: string;
}

type LoadState = "loading" | "success" | "error";

const getStatusLabel = (status?: string) => {
  const normalized = status?.toLowerCase().replace(/[\s-]+/g, "_");

  const labels: Record<string, string> = {
    pending: "Pending review",
    approved: "Approved",
    verified: "Verified",
    rejected: "Rejected",
    changes_requested: "Changes requested",
    suspended: "Suspended",
    draft: "Draft",
  };

  return normalized
    ? labels[normalized] ??
        normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Status unavailable";
};

const getStatusClass = (status?: string) => {
  const normalized = status?.toLowerCase().replace(/[\s-]+/g, "_");

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
};

export default function BusinessVerificationStatus() {
  const [verification, setVerification] =
    useState<VerificationResponse | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    const loadVerification = async () => {
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

        const data: VerificationResponse = await response.json();

        if (!controller.signal.aborted) {
          setVerification(data);
          setLoadState("success");
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadState("error");
        }
      }
    };

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

  const status = verification?.status;
  const isRejected = status?.toLowerCase() === "rejected";
  const rejectionReason =
    verification?.rejection_reason ||
    verification?.reason ||
    verification?.review_notes;

  return (
    <section
      className="verification-card"
      aria-label="Business verification status"
    >
      <div className="verification-card__heading">
        <BadgeCheck size={22} aria-hidden="true" />
        <div>
          <h2>Business verification</h2>
          <p>Track the review progress of your business application.</p>
        </div>
      </div>

      <div className="verification-card__status">
        <span
          className={`verification-status-badge verification-status-badge--${getStatusClass(status)}`}
        >
          {getStatusLabel(status)}
        </span>
      </div>

      {verification?.last_verified && (
        <p className="verification-card__date">
          Last verified:{" "}
          {new Date(verification.last_verified).toLocaleDateString()}
        </p>
      )}

      {isRejected && (
        <div className="verification-card__reason" role="alert">
          <div className="verification-card__reason-heading">
            <RefreshCw size={18} aria-hidden="true" />
            <strong>Application rejected</strong>
          </div>

          <p>
            {rejectionReason ||
              "A rejection reason was not provided in the available response. Please contact support for clarification."}
          </p>
        </div>
      )}
    </section>
  );
}

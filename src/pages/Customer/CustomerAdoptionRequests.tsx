
import { useEffect, useState } from "react";
import { RefreshCw, PawPrint, MessageCircle } from "lucide-react";
import AdoptionInformationReply from "./AdoptionInformationReply";
import "./CustomerAdoptionRequests.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://pawdigree-bckd.onrender.com";

interface InfoMessage {
  id: string;
  kind: "REQUEST" | "REPLY";
  body: string;
  created_at: string;
}

interface AdoptionApplication {
  application_id: string;
  pet_name: string;
  status: string;
  home_type?: string;
  has_outdoor_space?: boolean;
  has_other_pets?: boolean;
  other_pets_details?: string;
  previous_pet_experience?: string;
  message?: string;
  created_at?: string;
  info_messages?: InfoMessage[];
}

export default function CustomerAdoptionRequests() {
  const [applications, setApplications] = useState<
    AdoptionApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/adoptions/applications/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load adoption requests.");
      }

      const data = await response.json();

      setApplications(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchApplications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleReply = async (
    applicationId: string,
    reply: string
  ) => {
    const token = localStorage.getItem("access_token");

    const response = await fetch(
      `${API_BASE_URL}/api/adoptions/applications/${applicationId}/reply/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: reply }),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(
        data?.detail ||
          data?.message ||
          "Failed to send your reply."
      );
    }

    await fetchApplications();
  };

  const getStatusClass = (status: string) => {
    return status.toLowerCase().replaceAll("_", "-");
  };

  if (loading) {
    return (
      <div className="customer-requests-loading">
        <RefreshCw className="spin" />
        <p>Loading your adoption requests...</p>
      </div>
    );
  }

  return (
    <div className="customer-requests-page">
      <header className="customer-requests-header">
        <div>
          <h1>My Adoption Requests</h1>
          <p>
            Track your adoption applications and communicate
            with pet vendors.
          </p>
        </div>

        <button
          className="requests-refresh-button"
          onClick={fetchApplications}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="requests-error">
          {error}
        </div>
      )}

      {!error && applications.length === 0 && (
        <div className="requests-empty">
          <PawPrint size={48} />
          <h2>No adoption requests yet</h2>
          <p>
            Your adoption applications will appear here
            after you apply for a pet.
          </p>
        </div>
      )}

      <div className="customer-requests-list">
        {applications.map((application) => (
          <article
            className="customer-request-card"
            key={application.application_id}
          >
            <div className="request-card-header">
              <div className="request-pet-icon">
                <PawPrint size={22} />
              </div>

              <div className="request-pet-info">
                <h2>{application.pet_name || "Pet"}</h2>

                <span
                  className={`request-status ${getStatusClass(
                    application.status
                  )}`}
                >
                  {application.status.replaceAll("_", " ")}
                </span>
              </div>
            </div>

            <div className="request-details">
              <p>
                <strong>Home:</strong>{" "}
                {application.home_type || "Not provided"}
              </p>

              <p>
                <strong>Outdoor space:</strong>{" "}
                {application.has_outdoor_space ? "Yes" : "No"}
              </p>

              <p>
                <strong>Other pets:</strong>{" "}
                {application.has_other_pets ? "Yes" : "No"}
              </p>

              {application.previous_pet_experience && (
                <p>
                  <strong>Experience:</strong>{" "}
                  {application.previous_pet_experience}
                </p>
              )}
            </div>

            {application.message && (
              <div className="request-original-message">
                <strong>Your application message</strong>
                <p>{application.message}</p>
              </div>
            )}

            <div className="request-conversation-heading">
              <MessageCircle size={18} />
              <h3>Vendor Communication</h3>
            </div>

            <AdoptionInformationReply
              applicationId={application.application_id}
              petName={application.pet_name}
              vendorQuestions={(application.info_messages || [])
                .filter((message) => message.kind === "REQUEST")
                .map((message) => message.body)}
              messages={application.info_messages || []}
              onSubmitReply={handleReply}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

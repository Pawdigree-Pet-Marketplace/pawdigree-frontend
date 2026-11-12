import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, HeartHandshake, RefreshCw, Search, X } from "lucide-react";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import "./VendorAdoptionApplicationsPage.css";

type ApplicationStatus = "PENDING" | "INFO_REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED";
type StatusFilter = "ALL" | ApplicationStatus;

type AdoptionApplication = {
  application_id: string;
  pet: number;
  pet_name: string;
  customer_id: number;
  customer_username: string;
  customer_email: string;
  status: ApplicationStatus;
  home_type: "APARTMENT" | "HOUSE" | "OTHER";
  has_outdoor_space: boolean;
  has_other_pets: boolean;
  other_pets_details: string;
  previous_pet_experience: "NONE" | "SOME" | "EXPERIENCED";
  message: string;
  created_at: string;
  decided_at: string | null;
  decision_reason: string;
  business?: string | number;
};
type ListResponse = AdoptionApplication[] | { results?: AdoptionApplication[] };

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function isOpen(status: ApplicationStatus) {
  return status === "PENDING" || status === "INFO_REQUESTED";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

async function responseMessage(response: Response) {
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const messages = Object.values(data as Record<string, unknown>)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === "string");
    if (messages.length) return messages.join(" ");
  }
  return `Request failed (${response.status}). Please try again.`;
}

export default function VendorAdoptionApplicationsPage() {
  const activeBusiness = useVendorBusiness();
  const activeBusinessId = activeBusiness ? String(activeBusiness.id) : null;
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const loadApplications = useCallback(async () => {
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");
    if (!getToken() || role !== "VENDOR") {
      setLoadError("Sign in with your vendor account to view adoption applications.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const businessQuery = activeBusinessId ? `?business_id=${encodeURIComponent(activeBusinessId)}` : "";
      const response = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/adoptions/applications/vendor/${businessQuery}`);
      if (!response.ok) {
        setLoadError(response.status === 401
          ? "Your session has expired. Please sign in again."
          : await responseMessage(response));
        return;
      }
      const data = (await response.json()) as ListResponse;
      const items = Array.isArray(data) ? data : data.results ?? [];
      if (!activeBusinessId) {
        setApplications(items);
      } else {
        const petsResponse = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/pets/?business_id=${encodeURIComponent(activeBusinessId ?? "")}`);
        if (!petsResponse.ok) throw new Error("Could not match adoption applications to this business.");
        const petData = await petsResponse.json() as { results?: { pet_id: number; business?: string | number }[] } | { pet_id: number; business?: string | number }[];
        const pets = Array.isArray(petData) ? petData : petData.results ?? [];
        const petBusiness = new Map(pets.map((pet) => [pet.pet_id, String(pet.business ?? "")]));
        setApplications(items.filter((item) => (item.business !== undefined ? String(item.business) : petBusiness.get(item.pet)) === activeBusinessId));
      }
    } catch {
      setLoadError("We couldn't load adoption applications. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) return loadApplications();
      return undefined;
    });
    return () => { cancelled = true; };
  }, [loadApplications]);

  const statusCounts = useMemo(() => applications.reduce<Record<ApplicationStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { PENDING: 0, INFO_REQUESTED: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 }), [applications]);
  const openCount = statusCounts.PENDING + statusCounts.INFO_REQUESTED;
  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((item) => (statusFilter === "ALL" || item.status === statusFilter)
      && (!query || [item.pet_name, item.customer_username, item.customer_email, item.application_id]
        .some((value) => value.toLowerCase().includes(query))));
  }, [applications, search, statusFilter]);

  async function decide(application: AdoptionApplication, status: "APPROVED" | "REJECTED") {
    setBusyId(application.application_id);
    setActionError("");
    setNotice("");
    try {
      const response = await vendorAuthenticatedFetch(
        `${API_BASE_URL}/api/adoptions/applications/${application.application_id}/decision/${activeBusiness ? `?business_id=${encodeURIComponent(String(activeBusiness.id))}` : ""}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) {
        setActionError(await responseMessage(response));
        return;
      }
      const updated = (await response.json()) as { status?: ApplicationStatus; decision_reason?: string; decided_at?: string };
      setApplications((items) => items.map((item) => item.application_id === application.application_id
        ? { ...item, status: updated.status ?? status, decision_reason: updated.decision_reason ?? "", decided_at: updated.decided_at ?? new Date().toISOString() }
        : item));
      setNotice(`${application.pet_name} application ${status.toLowerCase()}.`);
    } catch {
      setActionError("We couldn't save this decision. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <VendorLayout title="Adoption applications" description="Review applications for pets in your store." vendorWorkspace>
      <section className="vendor-adoptions" aria-label="Adoption applications">
        <div className="vendor-adoptions-summary">
          <div className="vendor-adoptions-summary-icon"><HeartHandshake size={22} /></div>
          <div><span>Awaiting your decision</span><strong>{openCount}</strong></div>
          <button className="vendor-adoptions-refresh" type="button" onClick={() => void loadApplications()} disabled={loading}>
            <RefreshCw size={16} className={loading ? "is-spinning" : ""} /> Refresh
          </button>
        </div>

        <div className="vendor-adoptions-metrics" aria-label="Application status counts">
          {(["PENDING", "INFO_REQUESTED", "APPROVED", "REJECTED", "CANCELLED"] as const).map((status) => (
            <div className="vendor-adoptions-metric" key={status}>
              <span>{readable(status)}</span><strong>{statusCounts[status]}</strong>
            </div>
          ))}
        </div>

        {notice && <p className="vendor-adoptions-notice" role="status">{notice}</p>}
        {actionError && <p className="vendor-adoptions-error" role="alert">{actionError}</p>}

        {loading ? (
          <div className="vendor-adoptions-state" role="status">Loading adoption applications…</div>
        ) : loadError ? (
          <div className="vendor-adoptions-state vendor-adoptions-state-error" role="alert">
            <p>{loadError}</p><button type="button" onClick={() => void loadApplications()}>Try again</button>
          </div>
        ) : applications.length === 0 ? (
          <div className="vendor-adoptions-state">
            <HeartHandshake size={30} /><h2>No applications yet</h2>
            <p>Applications for your adoptable pets will show up here.</p>
          </div>
        ) : (
          <>
            <div className="vendor-adoptions-controls">
              <label className="vendor-adoptions-search"><Search size={17} aria-hidden="true" />
                <span className="vendor-adoptions-visually-hidden">Search applications</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by pet, applicant, email, or ID" />
              </label>
              <label className="vendor-adoptions-filter">Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="ALL">All statuses ({applications.length})</option>
                  {(["PENDING", "INFO_REQUESTED", "APPROVED", "REJECTED", "CANCELLED"] as const).map((status) => (
                    <option key={status} value={status}>{readable(status)} ({statusCounts[status]})</option>
                  ))}
                </select>
              </label>
            </div>
            {visibleApplications.length === 0 ? (
              <div className="vendor-adoptions-state"><h2>No matching applications</h2><p>Try another search or status.</p></div>
            ) : <div className="vendor-adoptions-list">
            {visibleApplications.map((application) => (
              <article className="vendor-adoption-card" key={application.application_id}>
                <header className="vendor-adoption-card-header">
                  <div><p className="vendor-adoption-eyebrow">{application.pet_name} · Pet #{application.pet}</p><h2>{application.customer_username || "Customer"}</h2></div>
                  <span className={`vendor-adoption-status vendor-adoption-status-${application.status.toLowerCase()}`}>{readable(application.status)}</span>
                </header>
                <a className="vendor-adoption-email" href={`mailto:${application.customer_email}`}>{application.customer_email}</a>
                <p className="vendor-adoption-date">Submitted {formatDate(application.created_at)}</p>

                <dl className="vendor-adoption-details">
                  <div><dt>Home</dt><dd>{readable(application.home_type)}</dd></div>
                  <div><dt>Outdoor space</dt><dd>{application.has_outdoor_space ? "Yes" : "No"}</dd></div>
                  <div><dt>Other pets</dt><dd>{application.has_other_pets ? `Yes${application.other_pets_details ? ` — ${application.other_pets_details}` : ""}` : "No"}</dd></div>
                  <div><dt>Pet experience</dt><dd>{readable(application.previous_pet_experience)}</dd></div>
                </dl>
                <div className="vendor-adoption-message"><h3>Why they want to adopt</h3><p>{application.message}</p></div>
                {application.decision_reason && <p className="vendor-adoption-reason"><strong>Decision note:</strong> {application.decision_reason}</p>}

                {isOpen(application.status) && (
                  <footer className="vendor-adoption-actions">
                    <button type="button" className="vendor-adoption-reject" disabled={busyId === application.application_id} onClick={() => void decide(application, "REJECTED")}>
                      <X size={16} /> {busyId === application.application_id ? "Saving…" : "Reject"}
                    </button>
                    <button type="button" className="vendor-adoption-approve" disabled={busyId === application.application_id} onClick={() => void decide(application, "APPROVED")}>
                      <Check size={16} /> {busyId === application.application_id ? "Saving…" : "Approve"}
                    </button>
                  </footer>
                )}
              </article>
            ))}
          </div>}
          </>
        )}
      </section>
    </VendorLayout>
  );
}

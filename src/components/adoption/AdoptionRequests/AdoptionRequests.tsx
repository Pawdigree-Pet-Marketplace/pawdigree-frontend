import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { customerAuthenticatedFetch } from "../../../services/customerAuthenticatedFetch";
import {
  BANNER,
  EXPERIENCE_LABEL,
  FILTERS,
  HOME_LABEL,
  STATUS_LABEL,
  buildTimeline,
  formatDate,
  matchesFilter,
  parseRequests,
  petTitle,
  readPet,
  withPet,
  type AdoptionRequest,
  type PetInfo,
  type StatusFilter,
} from "./adoptionRequestHelpers";
import "./AdoptionRequests.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: AdoptionRequest[] };

type Props = {
  /** Called by the "Find a pet" button in the empty state. */
  onFindPet: () => void;
};

function StatusBadge({ status }: { status: AdoptionRequest["status"] }) {
  return (
    <span
      className={`adoption-req-status adoption-req-status--${status.toLowerCase()}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Brand-style dog illustration used until a pet photo is available. */
function DogPlaceholder() {
  return (
    <svg viewBox="0 0 48 48" width="70%" height="70%" aria-hidden="true">
      <path d="M9 14c-3 4-4 11-1 16 2 3 5 3 6 0l1-10z" fill="#f08a6c" />
      <path d="M39 14c3 4 4 11 1 16-2 3-5 3-6 0l-1-10z" fill="#f08a6c" />
      <ellipse
        cx="24"
        cy="26"
        rx="13"
        ry="14"
        fill="#fff"
        stroke="#216c68"
        strokeWidth="2.4"
      />
      <circle cx="19" cy="23" r="1.9" fill="#216c68" />
      <circle cx="29" cy="23" r="1.9" fill="#216c68" />
      <ellipse cx="24" cy="29" rx="3.2" ry="2.4" fill="#216c68" />
      <path
        d="M24 31.4v2.6m-3 .6c1.4 1.5 4.6 1.5 6 0"
        fill="none"
        stroke="#216c68"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PetThumb({ request }: { request: AdoptionRequest }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="adoption-req-thumb" aria-hidden="true">
      {request.petImage && !failed ? (
        <img
          src={request.petImage}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <DogPlaceholder />
      )}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return value ? (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;
}

const yesNo = (value: boolean | null) =>
  value === null ? "" : value ? "Yes" : "No";

function RequestDetail({
  request,
  onBack,
}: {
  request: AdoptionRequest;
  onBack: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const banner = BANNER[request.status];
  const steps = buildTimeline(request);
  const hasAnswers = Boolean(
    request.homeType ||
    request.experience ||
    request.applicationMessage ||
    request.hasOutdoorSpace !== null ||
    request.hasOtherPets !== null,
  );

  // On phones the detail takes over the screen, so move focus to it.
  // On desktop it sits beside the list, so leave focus where it is.
  useEffect(() => {
    if (window.matchMedia("(max-width: 899px)").matches)
      headingRef.current?.focus();
  }, [request.id]);

  return (
    <div className="adoption-req-detail">
      <button type="button" className="adoption-req-back" onClick={onBack}>
        <ArrowLeft size={17} /> All requests
      </button>

      <h2 className="adoption-req-detail-title" ref={headingRef} tabIndex={-1}>
        Application status
      </h2>

      <article className="adoption-req-pet-card">
        <PetThumb request={request} />
        <div>
          <h3>{petTitle(request)}</h3>
          <p>{request.vendorName || `Application ${request.id.slice(0, 8)}`}</p>
        </div>
        <StatusBadge status={request.status} />
      </article>

      <section
        className={`adoption-req-banner adoption-req-banner--${request.status.toLowerCase()}`}
        aria-live="polite"
      >
        <span className="adoption-req-banner-icon" aria-hidden="true">
          {request.status === "APPROVED" ? (
            <Check size={18} />
          ) : request.status === "REJECTED" ||
            request.status === "CANCELLED" ? (
            <X size={18} />
          ) : (
            <ClipboardList size={17} />
          )}
        </span>
        <div>
          <h3>{banner.title}</h3>
          <p>{banner.body}</p>
          {request.note && (
            <p className="adoption-req-note">
              <strong>Message from the vendor:</strong> {request.note}
            </p>
          )}
        </div>
      </section>

      <section
        className="adoption-req-timeline"
        aria-label="Application timeline"
      >
        <h3>Timeline</h3>
        <ol>
          {steps.map((step) => (
            <li key={step.label} className={`is-${step.state}`}>
              <span className="adoption-req-dot" aria-hidden="true">
                {step.state === "done" && <Check size={11} />}
                {step.state === "stopped" && <X size={11} />}
              </span>
              <span className="adoption-req-step-label">{step.label}</span>
              {step.meta && (
                <span className="adoption-req-step-meta">{step.meta}</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {hasAnswers && (
        <section className="adoption-req-answers" aria-label="Your application">
          <h3>Your application</h3>
          <dl>
            <Fact
              label="Home"
              value={HOME_LABEL[request.homeType] ?? request.homeType}
            />
            <Fact
              label="Outdoor space"
              value={yesNo(request.hasOutdoorSpace)}
            />
            <Fact label="Other pets" value={yesNo(request.hasOtherPets)} />
            <Fact
              label="About your other pets"
              value={request.otherPetsDetails}
            />
            <Fact
              label="Pet experience"
              value={EXPERIENCE_LABEL[request.experience] ?? request.experience}
            />
          </dl>
          {request.applicationMessage && (
            <>
              <h4>Why you want this pet</h4>
              <p>{request.applicationMessage}</p>
            </>
          )}
        </section>
      )}

      {request.petId !== null && (
        <div className="adoption-req-actions">
          <Link className="adoption-req-primary" to={`/pets/${request.petId}`}>
            View pet <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AdoptionRequests({ onFindPet }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("request");

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [pets, setPets] = useState<Record<number, PetInfo>>({});
  const requestedPets = useRef(new Set<number>());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await customerAuthenticatedFetch(
          "/api/adoptions/my-applications/",
        );
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Please sign in again."
              : "We couldn’t load your adoption requests.",
          );
        }
        const data: unknown = await response.json();
        if (!cancelled)
          setState({ status: "ready", items: parseRequests(data) });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "We couldn’t load your adoption requests.",
          });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  // Look up each pet once (GET /api/pets/public/{id}/) for its name, breed, photo and vendor.
  useEffect(() => {
    if (state.status !== "ready") return;
    for (const item of state.items) {
      const id = item.petId;
      if (id === null || requestedPets.current.has(id)) continue;
      requestedPets.current.add(id);
      customerAuthenticatedFetch(`/api/pets/public/${id}/`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data: unknown) => {
          if (data) setPets((current) => ({ ...current, [id]: readPet(data) }));
        })
        .catch(() => {
          requestedPets.current.delete(id); // try again on the next refresh
        });
    }
  }, [state]);

  const items = useMemo(
    () =>
      state.status === "ready"
        ? state.items
            .map((item) =>
              withPet(item, item.petId !== null ? pets[item.petId] : undefined),
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
        : [],
    [state, pets],
  );

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      ALL: items.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    for (const item of items) {
      for (const { value } of FILTERS) {
        if (value !== "ALL" && matchesFilter(item.status, value))
          result[value] += 1;
      }
    }
    return result;
  }, [items]);

  const visible = useMemo(
    () => items.filter((item) => matchesFilter(item.status, filter)),
    [items, filter],
  );
  const selected = selectedId
    ? items.find((item) => item.id === selectedId)
    : undefined;

  const openRequest = (id: string) =>
    setSearchParams({ view: "requests", request: id });
  const closeRequest = () => setSearchParams({ view: "requests" });
  const refresh = () => {
    setState({ status: "loading" });
    setReload((current) => current + 1);
  };

  if (state.status === "loading") {
    return (
      <div className="customer-adoption-state" role="status">
        Loading your requests…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="customer-adoption-state" role="alert">
        <p>{state.message}</p>
        <button type="button" onClick={refresh}>
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="customer-adoption-state">
        <h3>No requests yet</h3>
        <p>
          When you apply for a pet, your request and its status will appear
          here.
        </p>
        <button type="button" onClick={onFindPet}>
          Find a pet
        </button>
      </div>
    );
  }

  return (
    <div className={`adoption-req${selected ? " has-selection" : ""}`}>
      <div className="adoption-req-top">
        <div className="customer-adoption-section-heading">
          <div>
            <h2>My adoption requests</h2>
            <p>Check the latest status of applications you’ve submitted.</p>
          </div>
          <button
            className="customer-adoption-refresh adoption-req-refresh"
            type="button"
            onClick={refresh}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div
          className="adoption-req-filters"
          role="group"
          aria-label="Filter by status"
        >
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "is-active" : ""}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label} <span>{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="adoption-req-split">
        <div className="adoption-req-list-col">
          {visible.length === 0 ? (
            <div className="customer-adoption-state">
              <h3>No {filter.toLowerCase()} requests</h3>
              <p>Nothing here right now.</p>
              <button type="button" onClick={() => setFilter("ALL")}>
                Show all requests
              </button>
            </div>
          ) : (
            <ul className="adoption-req-list">
              {visible.map((request) => (
                <li key={request.id}>
                  <button
                    type="button"
                    className={`adoption-req-item${request.id === selected?.id ? " is-selected" : ""}`}
                    aria-current={
                      request.id === selected?.id ? "true" : undefined
                    }
                    onClick={() => openRequest(request.id)}
                  >
                    <PetThumb request={request} />
                    <span className="adoption-req-item-main">
                      <strong>{petTitle(request)}</strong>
                      <span>
                        {request.vendorName ? `${request.vendorName} · ` : ""}
                        {formatDate(request.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={request.status} />
                    <ChevronRight
                      size={18}
                      className="adoption-req-chevron"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section className="adoption-req-pane" aria-label="Request details">
          {selected ? (
            <RequestDetail request={selected} onBack={closeRequest} />
          ) : (
            <div className="adoption-req-empty">
              <span className="adoption-req-empty-art">
                <DogPlaceholder />
              </span>
              <h3>Select a request</h3>
              <p>
                Choose an application from the list to see its status and
                timeline.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

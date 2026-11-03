import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, HeartHandshake, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import PetGrid from "../../components/pets/PetGrid";
import { PAGE_SIZE, type PublicPet, type PetQuery, DEFAULT_QUERY } from "../../data/pets";
import { useFavourites } from "../../hooks/useFavourites";
import { fetchPets } from "../../services/petsApi";
import { customerAuthenticatedFetch } from "../../services/customerAuthenticatedFetch";
import "./CustomerAdoptionPage.css";

type AdoptionRequestRecord = {
  application_id: string;
  pet: number;
  status: "PENDING" | "INFO_REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  created_at: string;
};
type RequestResponse = AdoptionRequestRecord[] | { results?: AdoptionRequestRecord[] };
type Section = "pets" | "requests";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function CustomerAdoptionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section: Section = searchParams.get("view") === "requests" ? "requests" : "pets";
  const [authorized] = useState(() => Boolean((localStorage.getItem("token") || sessionStorage.getItem("token")) && (localStorage.getItem("role") || sessionStorage.getItem("role")) === "CUSTOMER"));
  const [pets, setPets] = useState<PublicPet[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadPets, setReloadPets] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loadingPets, setLoadingPets] = useState(true);
  const [petError, setPetError] = useState("");
  const [requests, setRequests] = useState<AdoptionRequestRecord[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [requestReload, setRequestReload] = useState(0);
  const { ids: favourites, toggle: toggleFavourite } = useFavourites();

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    const query: PetQuery = { ...DEFAULT_QUERY, listingType: "ADOPTION", search: appliedSearch, page };
    fetchPets(query).then((result) => {
      if (!cancelled) { setPets(result.results); setCount(result.count); setPetError(""); }
    }).catch(() => { if (!cancelled) setPetError("We couldn’t load adoption pets. Please try again."); })
      .finally(() => { if (!cancelled) setLoadingPets(false); });
    return () => { cancelled = true; };
  }, [authorized, appliedSearch, page, reloadPets]);

  useEffect(() => {
    if (!authorized || section !== "requests" || requestsLoaded) return;
    let cancelled = false;
    async function loadRequests() {
      setLoadingRequests(true); setRequestError("");
      try {
        const response = await customerAuthenticatedFetch("/api/adoptions/my-applications/");
        if (!response.ok) throw new Error(response.status === 401 ? "Your session has expired. Please sign in again." : "We couldn’t load your adoption requests.");
        const data = await response.json() as RequestResponse;
        if (!cancelled) { setRequests(Array.isArray(data) ? data : data.results ?? []); setRequestsLoaded(true); }
      } catch (error) {
        if (!cancelled) setRequestError(error instanceof Error ? error.message : "We couldn’t load your adoption requests.");
      } finally { if (!cancelled) setLoadingRequests(false); }
    }
    void loadRequests();
    return () => { cancelled = true; };
  }, [authorized, section, requestsLoaded, requestReload]);

  if (!authorized) return null;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const changeSection = (next: Section) => setSearchParams(next === "requests" ? { view: "requests" } : {}, { replace: true });

  return <div className="customer-dashboard-layout"><CustomerDashboardNav />
    <main className="customer-dashboard-main customer-dashboard customer-adoption">
      <header className="customer-adoption-hero">
        <p className="dashboard-eyebrow">A NEW COMPANION STARTS HERE</p>
        <h1>Adoption</h1>
        <p>Meet pets looking for a home, then keep track of the applications you’ve sent.</p>
      </header>
      <div className="customer-adoption-tabs" role="tablist" aria-label="Adoption sections">
        <button type="button" role="tab" aria-selected={section === "pets"} className={section === "pets" ? "is-active" : ""} onClick={() => changeSection("pets")}><HeartHandshake size={18} /> Find a pet</button>
        <button type="button" role="tab" aria-selected={section === "requests"} className={section === "requests" ? "is-active" : ""} onClick={() => changeSection("requests")}><ClipboardList size={18} /> My requests</button>
      </div>

      {section === "pets" ? <section role="tabpanel" aria-label="Pets for adoption">
        <form className="customer-adoption-search" onSubmit={(event) => { event.preventDefault(); const nextSearch = search.trim(); if (nextSearch !== appliedSearch) { setLoadingPets(true); setPage(1); setAppliedSearch(nextSearch); } }}>
          <label htmlFor="adoption-search">Find an adoption pet</label>
          <div><Search size={19} aria-hidden="true" /><input id="adoption-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, breed, or species" /><button type="submit">Search</button></div>
        </form>
        <div className="customer-adoption-section-heading"><div><h2>Pets looking for a home</h2><p>{count} adoption listing{count === 1 ? "" : "s"}</p></div><Link to="/pets?listing_type=ADOPTION">Open full pet catalogue <ArrowRight size={16} /></Link></div>
        {petError ? <div className="customer-adoption-state" role="alert"><p>{petError}</p><button type="button" onClick={() => setReloadPets((current) => current + 1)}>Try again</button></div>
          : <PetGrid pets={pets} loading={loadingPets} favs={favourites} onToggleFav={toggleFavourite} />}
        {!loadingPets && !petError && pets.length === 0 && <div className="customer-adoption-state"><h3>No adoption pets found</h3><p>Try a different search, or check back soon.</p></div>}
        {pages > 1 && <nav className="customer-adoption-pagination" aria-label="Adoption listings pages"><button type="button" disabled={page <= 1 || loadingPets} onClick={() => { setLoadingPets(true); setPage((current) => current - 1); }}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page >= pages || loadingPets} onClick={() => { setLoadingPets(true); setPage((current) => current + 1); }}>Next</button></nav>}
      </section> : <section role="tabpanel" aria-label="My adoption requests">
        <div className="customer-adoption-section-heading"><div><h2>My adoption requests</h2><p>Check the latest status of applications you’ve submitted.</p></div><button className="customer-adoption-refresh" type="button" onClick={() => { setRequestsLoaded(false); setRequestReload((current) => current + 1); }} disabled={loadingRequests}>Refresh</button></div>
        {loadingRequests ? <div className="customer-adoption-state" role="status">Loading your requests…</div> : requestError ? <div className="customer-adoption-state" role="alert"><p>{requestError}</p><button type="button" onClick={() => setRequestReload((current) => current + 1)}>Try again</button></div> : requests.length === 0 ? <div className="customer-adoption-state"><h3>No requests yet</h3><p>When you apply for a pet, your request and its status will appear here.</p><button type="button" onClick={() => changeSection("pets")}>Find a pet</button></div> : <div className="customer-adoption-requests">{requests.map((request) => <article className="customer-adoption-request-card" key={request.application_id}>
          <div><p className="dashboard-eyebrow">APPLICATION</p><h3>Pet #{request.pet}</h3><p>Submitted {formatDate(request.created_at)}</p></div>
          <span className={`customer-adoption-status customer-adoption-status--${request.status.toLowerCase()}`}>{request.status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())}</span>
          <Link to={`/pets/${request.pet}`}>View pet <ArrowRight size={15} /></Link>
        </article>)}</div>}
      </section>}
    </main>
  </div>;
}

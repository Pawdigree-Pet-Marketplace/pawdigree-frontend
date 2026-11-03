import { type FormEvent, useEffect, useState } from "react";
import { ArrowRight, Search, Heart, PawPrint, Sparkles } from "lucide-react";
import { apiRequest } from "../../services/api";
import { Link, useSearchParams } from "react-router-dom";
import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import "./CustomerPetCataloguePage.css";

type Pet = {
  pet_id: number; name: string; species: string; breed?: string; age: number;
  gender: "MALE" | "FEMALE" | "UNKNOWN"; listing_type: "ADOPTION" | "SALE";
  price?: string | number | null; images?: { image?: string | null; is_primary?: boolean }[];
};
type Filters = { search: string; purpose: string; gender: string; breed: string; minAge: string; maxAge: string; page: number };
function readFilters(search: string): Filters {
  const query = new URLSearchParams(search);
  return { search: query.get("search") || "", purpose: query.get("listing_type") || "", gender: query.get("gender") || "", breed: query.get("breed") || "", minAge: query.get("age_min") || "", maxAge: query.get("age_max") || "", page: Math.max(1, Number(query.get("page") || 1)) };
}
function queryFor(filters: Filters) {
  const query = new URLSearchParams();
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.purpose) query.set("listing_type", filters.purpose);
  if (filters.gender) query.set("gender", filters.gender);
  if (filters.breed.trim()) query.set("breed", filters.breed.trim());
  if (filters.minAge) query.set("age_min", filters.minAge);
  if (filters.maxAge) query.set("age_max", filters.maxAge);
  if (filters.page > 1) query.set("page", String(filters.page));
  return query;
}
export default function CustomerPetCataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.toString();
  const [authorized] = useState(() => Boolean((localStorage.getItem("token") || sessionStorage.getItem("token")) && (localStorage.getItem("role") || sessionStorage.getItem("role")) === "CUSTOMER"));
  const [filters, setFilters] = useState(() => readFilters(search));
  const [draft, setDraft] = useState(() => readFilters(search));
  const [syncedSearch, setSyncedSearch] = useState(search);
  const [pets, setPets] = useState<Pet[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

  if (search !== syncedSearch) {
    setSyncedSearch(search);
    const next = readFilters(search);
    if (queryFor(next).toString() !== queryFor(filters).toString()) {
      setFilters(next);
    }
    setDraft(next);
  }

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const response = await apiRequest<{ count: number; results: Pet[] }>(`/pets/public/?${queryFor(filters)}`);
        if (!cancelled) { setPets(response.results); setCount(response.count); }
      } catch { if (!cancelled) setError("We could not load pet listings. Please try again later."); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [authorized, filters]);

  function apply(event: FormEvent) {
    event.preventDefault();
    if ([draft.minAge, draft.maxAge].some(v => v !== "" && !/^\d+$/.test(v))) { setFilterError("Enter ages as nonnegative whole numbers of months."); return; }
    if (draft.minAge && draft.maxAge && Number(draft.minAge) > Number(draft.maxAge)) { setFilterError("Minimum age must be less than or equal to maximum age."); return; }
    setFilterError(""); const next = { ...draft, page: 1 }; setFilters(next);
    setSearchParams(queryFor(next), { replace: true });
  }
  function clear() {
    const next = { search: "", purpose: "", gender: "", breed: "", minAge: "", maxAge: "", page: 1 };
    setDraft(next); setFilters(next); setFilterError(""); setSearchParams({}, { replace: true });
  }
  function changePage(page: number) {
    const next = { ...filters, page }; setFilters(next); setDraft(next);
    setSearchParams(queryFor(next), { replace: true }); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (!authorized) return null;
  const pages = Math.ceil(count / 20);
  return <div className="customer-dashboard-layout"><CustomerDashboardNav /><main className="customer-dashboard-main customer-dashboard pet-catalogue">
    <header className="catalogue-heading"><div className="catalogue-heading-decor" aria-hidden="true"><PawPrint className="catalogue-decor-paw catalogue-decor-paw-one"/><PawPrint className="catalogue-decor-paw catalogue-decor-paw-two"/><Sparkles className="catalogue-decor-sparkle"/></div><p className="dashboard-eyebrow">PAWDIGREE PET CATALOGUE</p><h1>Find your new companion</h1><p>Browse available pets from Pawdigree vendors and narrow the list to what you are looking for.</p></header>
    <form className="dashboard-search" onSubmit={apply} aria-label="Search pet catalogue"><label htmlFor="catalogue-search">Search pet listings</label><div className="dashboard-search-row"><Search size={22} aria-hidden="true"/><input id="catalogue-search" type="text" placeholder="Name, breed, species or listing details" value={draft.search} onChange={e => setDraft({ ...draft, search: e.target.value })}/><button type="submit" aria-label="Search pets"><ArrowRight size={21}/></button></div></form>
    <form className="dashboard-filters" onSubmit={apply} aria-label="Filter pet catalogue"><div className="dashboard-filter-grid">
      <label>Species / category<input value={draft.search} onChange={e => setDraft({ ...draft, search: e.target.value })} placeholder="e.g. dog, cat, bird" /></label>
      <label>Purpose<select value={draft.purpose} onChange={e => setDraft({ ...draft, purpose: e.target.value })}><option value="">Any purpose</option><option value="ADOPTION">Adoption</option><option value="SALE">For sale</option></select></label>
      <label>Gender<select value={draft.gender} onChange={e => setDraft({ ...draft, gender: e.target.value })}><option value="">Any gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="UNKNOWN">Unknown</option></select></label>
      <label>Breed<input value={draft.breed} onChange={e => setDraft({ ...draft, breed: e.target.value })} placeholder="Exact breed" /></label>
      <label>Minimum age (months)<input type="number" min="0" step="1" value={draft.minAge} onChange={e => setDraft({ ...draft, minAge: e.target.value })}/></label>
      <label>Maximum age (months)<input type="number" min="0" step="1" value={draft.maxAge} onChange={e => setDraft({ ...draft, maxAge: e.target.value })}/></label>
    </div><div className="dashboard-filter-actions"><button type="submit">Apply filters</button><button type="button" className="dashboard-filter-clear" onClick={clear}>Clear filters</button></div>{filterError && <p className="dashboard-filter-error" role="alert">{filterError}</p>}</form>
    <section className="dashboard-section dashboard-listings" aria-live="polite"><div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">AVAILABLE NOW</p><h2>Pet listings</h2><p>{count} listing{count === 1 ? "" : "s"} found</p></div><Link to="/customer/dashboard" className="dashboard-text-link">Back to dashboard <ArrowRight size={16}/></Link></div>
      {loading ? <div className="dashboard-empty-state" role="status">Finding pets for you...</div> : error ? <div className="dashboard-empty-state" role="alert"><h3>We couldn’t load the listings</h3><p>{error}</p></div> : pets.length === 0 ? <div className="dashboard-empty-state"><div className="dashboard-empty-icon"><Search size={32}/></div><h3>No pets match these filters</h3><p>Try changing your search or clearing the filters.</p><button className="dashboard-clear-search" onClick={clear}>Clear filters</button></div> : <div className="dashboard-pet-grid">{pets.map(pet => { const image = pet.images?.find(i => i.is_primary)?.image || pet.images?.[0]?.image; const age = pet.age < 12 ? `${pet.age} months old` : `${Math.floor(pet.age / 12)} years old`; return <article className="dashboard-pet-card" key={pet.pet_id}>{image ? <img src={image} alt={pet.name} loading="lazy"/> : <div className="dashboard-pet-image-placeholder"><Heart size={30}/><Sparkles size={14}/></div>}<div className="dashboard-pet-card-content"><p className="dashboard-pet-type">{pet.listing_type === "ADOPTION" ? "For adoption" : "For sale"}</p><h3>{pet.name}</h3><p>{[pet.breed, pet.species].filter(Boolean).join(" · ")}</p><p>{age} · {pet.gender.toLowerCase()}</p>{pet.listing_type === "SALE" && pet.price != null && <p className="dashboard-pet-price">UGX {Number(pet.price).toLocaleString("en-UG")}</p>}</div></article>; })}</div>}
      {pages > 1 && <nav className="catalogue-pagination" aria-label="Catalogue pages"><button type="button" disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Previous</button><span>Page {filters.page} of {pages}</span><button type="button" disabled={filters.page >= pages} onClick={() => changePage(filters.page + 1)}>Next</button></nav>}
    </section>
  </main></div>;
}

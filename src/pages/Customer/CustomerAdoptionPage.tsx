import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bone,
  ClipboardList,
  HeartHandshake,
  Search,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AdoptionRequests from "../../components/adoption/AdoptionRequests/AdoptionRequests";
import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import PetGrid from "../../components/pets/PetGrid";
import {
  PAGE_SIZE,
  type PublicPet,
  type PetQuery,
  DEFAULT_QUERY,
} from "../../data/pets";
import { useFavourites } from "../../hooks/useFavourites";
import { fetchPets } from "../../services/petsApi";
import "./CustomerAdoptionPage.css";

type Section = "pets" | "requests";

export default function CustomerAdoptionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section: Section =
    searchParams.get("view") === "requests" ? "requests" : "pets";
  const [authorized] = useState(() =>
    Boolean(
      (localStorage.getItem("token") || sessionStorage.getItem("token")) &&
      (localStorage.getItem("role") || sessionStorage.getItem("role")) ===
        "CUSTOMER",
    ),
  );
  const [pets, setPets] = useState<PublicPet[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadPets, setReloadPets] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loadingPets, setLoadingPets] = useState(true);
  const [petError, setPetError] = useState("");
  const { ids: favourites, toggle: toggleFavourite } = useFavourites();

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    const query: PetQuery = {
      ...DEFAULT_QUERY,
      listingType: "ADOPTION",
      search: appliedSearch,
      page,
    };
    fetchPets(query)
      .then((result) => {
        if (!cancelled) {
          setPets(result.results);
          setCount(result.count);
          setPetError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setPetError("We couldn’t load adoption pets. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorized, appliedSearch, page, reloadPets]);

  if (!authorized) return null;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const changeSection = (next: Section) =>
    setSearchParams(next === "requests" ? { view: "requests" } : {}, {
      replace: true,
    });

  return (
    <div className="customer-dashboard-layout">
      <CustomerDashboardNav />
      <main className="customer-dashboard-main customer-dashboard customer-adoption">
        <header className="customer-adoption-hero">
          <div className="customer-adoption-hero-decor" aria-hidden="true">
            <Bone className="adoption-decor-bone" />
            <Bone className="adoption-decor-bone adoption-decor-bone-small" />
            <span className="adoption-decor-dot" />
          </div>
          <p className="dashboard-eyebrow">A NEW COMPANION STARTS HERE</p>
          <h1>Adoption</h1>
          <p>
            Meet pets looking for a home, then keep track of the applications
            you’ve sent.
          </p>
        </header>
        <div
          className="customer-adoption-tabs"
          role="tablist"
          aria-label="Adoption sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === "pets"}
            className={section === "pets" ? "is-active" : ""}
            onClick={() => changeSection("pets")}
          >
            <HeartHandshake size={18} /> Find a pet
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === "requests"}
            className={section === "requests" ? "is-active" : ""}
            onClick={() => changeSection("requests")}
          >
            <ClipboardList size={18} /> My requests
          </button>
        </div>

        {section === "pets" ? (
          <section role="tabpanel" aria-label="Pets for adoption">
            <form
              className="customer-adoption-search"
              onSubmit={(event) => {
                event.preventDefault();
                const nextSearch = search.trim();
                if (nextSearch !== appliedSearch) {
                  setLoadingPets(true);
                  setPage(1);
                  setAppliedSearch(nextSearch);
                }
              }}
            >
              <label htmlFor="adoption-search">Find an adoption pet</label>
              <div>
                <Search size={19} aria-hidden="true" />
                <input
                  id="adoption-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, breed, or species"
                />
                <button type="submit">Search</button>
              </div>
            </form>
            <div className="customer-adoption-section-heading">
              <div>
                <h2>Pets looking for a home</h2>
                <p>
                  {count} adoption listing{count === 1 ? "" : "s"}
                </p>
              </div>
              <Link to="/pets?listing_type=ADOPTION">
                Open full pet catalogue <ArrowRight size={16} />
              </Link>
            </div>
            {petError ? (
              <div className="customer-adoption-state" role="alert">
                <p>{petError}</p>
                <button
                  type="button"
                  onClick={() => setReloadPets((current) => current + 1)}
                >
                  Try again
                </button>
              </div>
            ) : (
              <PetGrid
                pets={pets}
                loading={loadingPets}
                favs={favourites}
                onToggleFav={toggleFavourite}
              />
            )}
            {!loadingPets && !petError && pets.length === 0 && (
              <div className="customer-adoption-state">
                <h3>No adoption pets found</h3>
                <p>Try a different search, or check back soon.</p>
              </div>
            )}
            {pages > 1 && (
              <nav
                className="customer-adoption-pagination"
                aria-label="Adoption listings pages"
              >
                <button
                  type="button"
                  disabled={page <= 1 || loadingPets}
                  onClick={() => {
                    setLoadingPets(true);
                    setPage((current) => current - 1);
                  }}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages || loadingPets}
                  onClick={() => {
                    setLoadingPets(true);
                    setPage((current) => current + 1);
                  }}
                >
                  Next
                </button>
              </nav>
            )}
          </section>
        ) : (
          <section role="tabpanel" aria-label="My adoption requests">
            <AdoptionRequests onFindPet={() => changeSection("pets")} />
          </section>
        )}
      </main>
    </div>
  );
}

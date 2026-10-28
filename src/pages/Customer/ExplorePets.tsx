import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  BadgeCheck,
  Heart,
  PawPrint,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import Breather from "../../components/common/Breather";
import Button from "../../components/common/Button";
import CtaBanner from "../../components/common/CtaBanner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import Reveal from "../../components/common/Reveal";
import Typeahead from "../../components/common/Typeahead";
import ActiveFilterChips, {
  type ActiveChip,
} from "../../components/pets/ActiveFilterChips";
import FeaturedRail from "../../components/pets/FeaturedRail";
import MostSearched from "../../components/pets/MostSearched";
import PetFilters, { PET_FILTERS_ID } from "../../components/pets/PetFilters";
import PetGrid from "../../components/pets/PetGrid";
import SpeciesQuickPicks from "../../components/pets/SpeciesQuickPicks";
import {
  EMPTY_FILTERS,
  PAGE_SIZE,
  SPECIES,
  type FeaturedPet,
  type PagedPets,
  type PetFilters as Filters,
  type PetQuery,
  type SpeciesKey,
  type Suggestion,
  type SuggestionKind,
  type TrendingSearch,
} from "../../data/pets";
import {
  paramsToQuery,
  prefersReducedMotion,
  queryFilters,
  queryToParams,
} from "../../utils/petUtils";
import { useFavourites } from "../../hooks/useFavourites";
import {
  fetchFeatured,
  fetchPets,
  fetchSuggestions,
  fetchTrendingSearches,
} from "../../services/petsApi";
import "./ExplorePets.css";

const ALL_KINDS: SuggestionKind[] = ["breed", "pet", "location", "vendor"];
const EMPTY_PAGE: PagedPets = { count: 0, results: [] };

type Patch = Partial<PetQuery> | ((prev: PetQuery) => Partial<PetQuery>);

export default function ExplorePets() {
  /* navbar (same pattern as the vendor landing page) */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      setIsLoggedIn(!!token);
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("focus", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  /* query state (mirrors the URL, so results are shareable) */
  const [query, setQuery] = useState<PetQuery>(() =>
    paramsToQuery(window.location.search),
  );
  const [searchInput, setSearchInput] = useState(query.search);
  const [draft, setDraft] = useState<Filters>(() => queryFilters(query));
  const [filterError, setFilterError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* data */
  const [result, setResult] = useState<{
    key: string;
    data?: PagedPets;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [featured, setFeatured] = useState<FeaturedPet[]>([]);
  const [trending, setTrending] = useState<TrendingSearch[]>([]);
  const [didYouMeanFor, setDidYouMeanFor] = useState<{
    term: string;
    items: Suggestion[];
  } | null>(null);

  const { ids: favs, toggle: toggleFav } = useFavourites();
  const resultsRef = useRef<HTMLElement>(null);

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
  }, []);

  const updateQuery = useCallback(
    (patch: Patch, opts?: { scroll?: boolean }) => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        ...(typeof patch === "function" ? patch(prev) : patch),
      }));
      if (opts?.scroll) scrollToResults();
    },
    [scrollToResults],
  );

  /* keep the sidebar draft in step with the applied query (adjusted while rendering, not in an effect) */
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setDraft(queryFilters(query));
  }

  /* URL sync */
  useEffect(() => {
    const qs = queryToParams(query).toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
  }, [query]);

  /* fetch the page of pets whenever the query changes.
     "loading" is derived: it is simply "the stored answer is not for the current query yet". */
  const queryKey = `${queryToParams(query).toString()}#${reloadKey}`;
  useEffect(() => {
    let cancelled = false;
    fetchPets(query)
      .then((res) => {
        if (cancelled) return;
        const pages = Math.max(1, Math.ceil(res.count / PAGE_SIZE));
        if (query.page > pages) {
          // filters shrank the results below this page: go back to the last page
          setQuery((prev) => ({ ...prev, page: pages }));
          return;
        }
        setResult({ key: queryKey, data: res });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: queryKey });
      });
    return () => {
      cancelled = true;
    };
  }, [query, queryKey]);

  const answered = result?.key === queryKey;
  const status: "loading" | "ready" | "error" = !answered
    ? "loading"
    : result.data
      ? "ready"
      : "error";
  const data: PagedPets = (answered && result.data) || EMPTY_PAGE;
  const totalPages = Math.max(1, Math.ceil(data.count / PAGE_SIZE));

  /* top picks + most searched: fetched once */
  useEffect(() => {
    let cancelled = false;
    fetchFeatured()
      .then((res) => !cancelled && setFeatured(res))
      .catch(() => undefined);
    fetchTrendingSearches()
      .then((res) => !cancelled && setTrending(res))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /* "Did you mean ...?" when a typed search finds nothing */
  const searchTerm = query.search.trim();
  const wantsSuggestions =
    status === "ready" && data.count === 0 && searchTerm !== "";
  useEffect(() => {
    if (!wantsSuggestions) return;
    let cancelled = false;
    fetchSuggestions(searchTerm, ["breed", "location", "vendor"])
      .then((res) => {
        if (!cancelled)
          setDidYouMeanFor({
            term: searchTerm,
            items: res.filter((s) => s.fuzzy).slice(0, 3),
          });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [wantsSuggestions, searchTerm]);
  const didYouMean =
    wantsSuggestions && didYouMeanFor?.term === searchTerm
      ? didYouMeanFor.items
      : [];

  /* mobile filter sheet: lock scroll, close on Escape / when resized to desktop */
  useEffect(() => {
    if (!filtersOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [filtersOpen]);

  /* active filter chips (plain data; removal is handled by removeChip) */
  const chips = useMemo<ActiveChip[]>(() => {
    const list: ActiveChip[] = [];
    if (query.search.trim())
      list.push({
        id: "search",
        label: `“${query.search.trim()}”`,
        isSearch: true,
      });
    query.species.forEach((s) =>
      list.push({
        id: `sp-${s}`,
        label: SPECIES.find((x) => x.key === s)?.plural ?? s,
      }),
    );
    if (query.listingType) {
      list.push({
        id: "type",
        label: query.listingType === "ADOPTION" ? "Adoption" : "For sale",
      });
    }
    query.locations.forEach((loc) =>
      list.push({ id: `loc-${loc}`, label: loc }),
    );
    if (query.vendor.trim())
      list.push({ id: "vendor", label: query.vendor.trim() });
    if (query.gender) {
      list.push({
        id: "gender",
        label:
          query.gender === "MALE"
            ? "Male"
            : query.gender === "FEMALE"
              ? "Female"
              : "Unknown",
      });
    }
    if (query.minAge || query.maxAge) {
      list.push({
        id: "age",
        label: `Age ${query.minAge || "0"}–${query.maxAge || "any"} mo`,
      });
    }
    if (query.minPrice || query.maxPrice) {
      list.push({
        id: "price",
        label: `UGX ${query.minPrice || "0"}–${query.maxPrice || "any"}`,
      });
    }
    return list;
  }, [query]);

  const hasCriteria = chips.length > 0;
  const filterCount = chips.filter((c) => !c.isSearch).length;

  /* handlers */
  function removeChip(id: string) {
    if (id === "search") {
      setSearchInput("");
      updateQuery({ search: "" });
    } else if (id.startsWith("sp-")) {
      const key = id.slice(3);
      updateQuery((prev) => ({
        species: prev.species.filter((x) => x !== key),
      }));
    } else if (id.startsWith("loc-")) {
      const loc = id.slice(4);
      updateQuery((prev) => ({
        locations: prev.locations.filter((x) => x !== loc),
      }));
    } else if (id === "type") updateQuery({ listingType: "" });
    else if (id === "vendor") updateQuery({ vendor: "" });
    else if (id === "gender") updateQuery({ gender: "" });
    else if (id === "age") updateQuery({ minAge: "", maxAge: "" });
    else if (id === "price") updateQuery({ minPrice: "", maxPrice: "" });
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateQuery({ search: searchInput.trim() }, { scroll: true });
  }

  function handleSearchPick(s: Suggestion) {
    if (s.kind === "location") {
      setSearchInput("");
      updateQuery(
        (prev) => ({
          search: "",
          locations: prev.locations.some(
            (l) => l.toLowerCase() === s.label.toLowerCase(),
          )
            ? prev.locations
            : [...prev.locations, s.label],
        }),
        { scroll: true },
      );
    } else if (s.kind === "vendor") {
      setSearchInput("");
      updateQuery({ search: "", vendor: s.label }, { scroll: true });
    } else {
      setSearchInput(s.label);
      updateQuery({ search: s.label }, { scroll: true });
    }
  }

  function applyTrending(term: string) {
    setSearchInput(term);
    updateQuery({ search: term }, { scroll: true });
  }

  function toggleSpecies(key: SpeciesKey) {
    updateQuery(
      (prev) => ({
        species: prev.species.includes(key)
          ? prev.species.filter((s) => s !== key)
          : [...prev.species, key],
      }),
      { scroll: true },
    );
  }

  function applyDraft() {
    const numbers = [
      draft.minAge,
      draft.maxAge,
      draft.minPrice,
      draft.maxPrice,
    ];
    if (numbers.some((v) => v !== "" && !/^\d+$/.test(v))) {
      setFilterError("Enter ages and prices as whole numbers.");
      return;
    }
    if (
      draft.minAge !== "" &&
      draft.maxAge !== "" &&
      Number(draft.minAge) > Number(draft.maxAge)
    ) {
      setFilterError("Minimum age must be less than or equal to maximum age.");
      return;
    }
    if (
      draft.minPrice !== "" &&
      draft.maxPrice !== "" &&
      Number(draft.minPrice) > Number(draft.maxPrice)
    ) {
      setFilterError(
        "Minimum price must be less than or equal to maximum price.",
      );
      return;
    }
    setFilterError("");
    updateQuery({ ...draft }, { scroll: true });
    setFiltersOpen(false);
  }

  function clearAll() {
    setSearchInput("");
    setFilterError("");
    updateQuery({ ...EMPTY_FILTERS, search: "" });
    setFiltersOpen(false);
  }

  function goToPage(page: number) {
    setQuery((prev) => ({
      ...prev,
      page: Math.min(Math.max(1, page), totalPages),
    }));
    scrollToResults();
  }

  const from = data.count === 0 ? 0 : (query.page - 1) * PAGE_SIZE + 1;
  const to = from + data.results.length - (data.count === 0 ? 0 : 1);

  return (
    <>
      <TopNavbar
        isLoggedIn={isLoggedIn}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <main className="ep-page" id="home">
        {/* HERO */}
        <div className="ep-container">
          <header className="ep-hero">
            <div className="ep-hero-decor" aria-hidden="true">
              <PawPrint className="ep-decor ep-decor-paw-1" size={34} />
              <PawPrint className="ep-decor ep-decor-paw-2" size={24} />
              <PawPrint className="ep-decor ep-decor-paw-3" size={28} />
              <Heart
                className="ep-decor ep-decor-heart"
                size={24}
                fill="currentColor"
              />
              <Sparkles className="ep-decor ep-decor-sparkle-1" size={22} />
              <Sparkles className="ep-decor ep-decor-sparkle-2" size={15} />
            </div>

            <nav className="ep-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Explore Pets</span>
            </nav>

            <p className="ep-eyebrow">Find your new best friend</p>
            <h1>Explore Pets</h1>
            <p className="ep-hero-sub">
              Pets for adoption and sale from verified vendors across Uganda.
            </p>

            <form
              className="ep-search"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <Typeahead
                variant="pill"
                label="Search pets, breeds, locations or vendors"
                hideLabel
                placeholder="Search by breed, name, location or vendor… try “chinchilla rabbit”"
                value={searchInput}
                onChange={setSearchInput}
                onPick={handleSearchPick}
                loadSuggestions={(q) => fetchSuggestions(q, ALL_KINDS)}
                icon={<Search size={22} aria-hidden="true" />}
              />
              <button
                type="submit"
                className="ep-search-btn"
                aria-label="Search pets"
              >
                <ArrowRight size={21} aria-hidden="true" />
              </button>
            </form>

            <SpeciesQuickPicks
              selected={query.species}
              onToggle={toggleSpecies}
            />

            <ul className="ep-trust">
              <li>
                <BadgeCheck size={19} aria-hidden="true" />
                <span>
                  <strong>Verified vendors</strong>
                  Businesses checked by our team
                </span>
              </li>
              <li>
                <ShieldCheck size={19} aria-hidden="true" />
                <span>
                  <strong>Approved listings only</strong>
                  Every pet is reviewed first
                </span>
              </li>
              <li>
                <Heart size={19} aria-hidden="true" />
                <span>
                  <strong>Adopt with confidence</strong>
                  Talk to vendors before you decide
                </span>
              </li>
            </ul>
          </header>
        </div>

        {/* TOP PICKS: only on the clean, unfiltered view */}
        {!hasCriteria && featured.length > 0 && (
          <Reveal className="ep-container ep-section">
            <section aria-labelledby="ep-featured-title">
              <div className="ep-section-head">
                <div>
                  <p className="ep-eyebrow">Hand-picked for you</p>
                  <h2 id="ep-featured-title" className="ep-section-title">
                    Top picks
                  </h2>
                  <p className="ep-section-sub">
                    Fresh listings from trusted vendors that pet seekers love
                    right now.
                  </p>
                </div>
              </div>
              <FeaturedRail
                items={featured}
                favs={favs}
                onToggleFav={toggleFav}
              />
            </section>
          </Reveal>
        )}

        {/* MOST SEARCHED */}
        {!hasCriteria && trending.length > 0 && (
          <Reveal className="ep-container ep-section">
            <MostSearched items={trending} onSelect={applyTrending} />
          </Reveal>
        )}

        {/* RESULTS */}
        <section
          className="ep-container ep-results"
          id="ep-results"
          ref={resultsRef}
          aria-labelledby="ep-results-title"
        >
          <div className="ep-results-layout">
            <div
              className={`ep-backdrop${filtersOpen ? " is-open" : ""}`}
              onClick={() => setFiltersOpen(false)}
              aria-hidden="true"
            />

            <aside className="ep-sidebar">
              <PetFilters
                draft={draft}
                setDraft={setDraft}
                sort={query.sort}
                onSort={(sort) => updateQuery({ sort })}
                onApply={applyDraft}
                onClear={clearAll}
                onClose={() => setFiltersOpen(false)}
                error={filterError}
                open={filtersOpen}
                canClear={hasCriteria}
                onLoadSuggestions={fetchSuggestions}
              />
            </aside>

            <div className="ep-results-main">
              <div className="ep-results-head">
                <div>
                  <h2 id="ep-results-title" className="ep-section-title">
                    {hasCriteria ? "Matching pets" : "All pets"}
                  </h2>
                  <p className="ep-results-count" aria-live="polite">
                    {status === "loading"
                      ? "Finding pets…"
                      : data.count === 0
                        ? "No pets found"
                        : `Showing ${from}–${to} of ${data.count.toLocaleString("en-UG")} pets`}
                  </p>
                </div>
                <button
                  type="button"
                  className="ep-filter-toggle"
                  onClick={() => setFiltersOpen(true)}
                  aria-expanded={filtersOpen}
                  aria-controls={PET_FILTERS_ID}
                >
                  <SlidersHorizontal size={18} aria-hidden="true" />
                  Filters &amp; sort
                  {filterCount > 0 && (
                    <span className="ep-badge">{filterCount}</span>
                  )}
                </button>
              </div>

              <ActiveFilterChips
                chips={chips}
                onRemove={removeChip}
                onClearAll={clearAll}
              />

              {status === "loading" ? (
                <PetGrid
                  pets={[]}
                  loading
                  favs={favs}
                  onToggleFav={toggleFav}
                />
              ) : status === "error" ? (
                <EmptyState
                  role="alert"
                  icon={<PawPrint size={34} />}
                  title="We couldn’t load the pets"
                  text="Something went wrong on our side. Please try again."
                >
                  <Button onClick={() => setReloadKey((k) => k + 1)}>
                    Try again
                  </Button>
                </EmptyState>
              ) : data.results.length === 0 ? (
                <EmptyState
                  icon={<Search size={32} />}
                  title={
                    hasCriteria
                      ? "No pets match these filters"
                      : "No pets listed yet"
                  }
                  text={
                    hasCriteria
                      ? "Try removing a filter, or check the spelling of your search."
                      : "New listings are added by vendors every day. Check back soon."
                  }
                >
                  {didYouMean.length > 0 && (
                    <div className="ep-didyoumean">
                      <span>Did you mean:</span>
                      {didYouMean.map((s) => (
                        <button
                          type="button"
                          key={`${s.kind}-${s.label}`}
                          onClick={() => handleSearchPick(s)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {hasCriteria && (
                    <Button onClick={clearAll}>Clear search and filters</Button>
                  )}
                </EmptyState>
              ) : (
                <PetGrid
                  key={`${query.page}-${query.sort}`}
                  pets={data.results}
                  favs={favs}
                  onToggleFav={toggleFav}
                  breather={
                    <Breather title="Found a favourite?">
                      Tap the heart to save it. Message the vendor before you
                      decide, and always meet the pet in person first.
                    </Breather>
                  }
                />
              )}

              {status === "ready" && (
                <Pagination
                  page={query.page}
                  totalPages={totalPages}
                  onChange={goToPage}
                />
              )}
            </div>
          </div>
        </section>

        {/* VENDOR CTA */}
        <Reveal className="ep-container ep-section">
          <CtaBanner
            eyebrow="For pet businesses"
            title="Have pets that need a loving home?"
            text="Become a Pawdigree vendor and reach pet seekers across Uganda."
            href="/vendor"
            actionLabel="Become a vendor"
          />
        </Reveal>
      </main>
    </>
  );
}

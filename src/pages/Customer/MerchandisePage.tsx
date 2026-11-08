import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  PawPrint,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Button from "../../components/common/Button";
import CommonCtaBanner from "../../components/common/CommonCtaBanner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import Reveal from "../../components/common/Reveal";
import MerchFilters, {
  MERCH_FILTERS_ID,
} from "../../components/merchandise/MerchFilters";
import MerchGrid from "../../components/merchandise/MerchGrid";
import ActiveFilterChips, {
  type ActiveChip,
} from "../../components/pets/ActiveFilterChips";
import {
  MERCH_PAGE_SIZE,
  readMerchQuery,
  writeMerchQuery,
  type MerchCategory,
  type MerchFilterValues,
  type MerchQuery,
  type PagedProducts,
} from "../../data/merchandise";
import {
  fetchMerchCategories,
  fetchProducts,
} from "../../services/merchandiseApi";
import { prefersReducedMotion } from "../../utils/petUtils";
import "./MerchandisePage.css";

const EMPTY_PAGE: PagedProducts = { count: 0, results: [] };

export default function MerchandisePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const query = useMemo(
    () => readMerchQuery(new URLSearchParams(paramsKey)),
    [paramsKey],
  );

  const [result, setResult] = useState<{
    key: string;
    data?: PagedProducts;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<MerchCategory[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  const queryKey = `${paramsKey}#${reloadKey}`;

  const updateQuery = useCallback(
    (patch: Partial<MerchQuery>, opts?: { scroll?: boolean }) => {
      setSearchParams(writeMerchQuery({ ...query, page: 1, ...patch }));
      if (opts?.scroll) {
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start",
          });
        });
      }
    },
    [query, setSearchParams],
  );

  /* fetch the page of products whenever the query changes */
  useEffect(() => {
    let cancelled = false;
    fetchProducts(query)
      .then((res) => {
        if (cancelled) return;
        const pages = Math.max(1, Math.ceil(res.count / MERCH_PAGE_SIZE));
        if (query.page > pages) {
          // the URL asked for a page that does not exist: go to the last one
          setSearchParams(writeMerchQuery({ ...query, page: pages }), {
            replace: true,
          });
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
  }, [query, queryKey, setSearchParams]);

  /* categories for the filter: fetched once, a failure just hides the field */
  useEffect(() => {
    let cancelled = false;
    fetchMerchCategories()
      .then((res) => !cancelled && setCategories(res))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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

  // "loading" is derived: the stored answer is not for the current query yet
  const answered = result?.key === queryKey;
  const status: "loading" | "ready" | "error" = !answered
    ? "loading"
    : result.data
      ? "ready"
      : "error";
  const data: PagedProducts = (answered && result.data) || EMPTY_PAGE;
  const totalPages = Math.max(1, Math.ceil(data.count / MERCH_PAGE_SIZE));

  /* active filter chips */
  const chips = useMemo<ActiveChip[]>(() => {
    const list: ActiveChip[] = [];
    if (query.search)
      list.push({ id: "search", label: `“${query.search}”`, isSearch: true });
    if (query.category) {
      const name = categories.find(
        (c) => String(c.id) === query.category,
      )?.name;
      list.push({ id: "category", label: name ?? "Category" });
    }
    if (query.vendor)
      list.push({ id: "vendor", label: `Vendor: ${query.vendor}` });
    if (query.inStock) list.push({ id: "stock", label: "In stock only" });
    if (query.minPrice || query.maxPrice)
      list.push({
        id: "price",
        label: `UGX ${query.minPrice || "0"}–${query.maxPrice || "any"}`,
      });
    return list;
  }, [query, categories]);

  const hasCriteria = chips.length > 0;
  const filterCount = chips.filter((c) => !c.isSearch).length;

  function removeChip(id: string) {
    if (id === "search") updateQuery({ search: "" });
    else if (id === "category") updateQuery({ category: "" });
    else if (id === "vendor") updateQuery({ vendor: "" });
    else if (id === "stock") updateQuery({ inStock: false });
    else if (id === "price") updateQuery({ minPrice: "", maxPrice: "" });
  }

  function clearAll() {
    setSearchParams({});
    setFiltersOpen(false);
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("search");
    updateQuery({ search: String(value ?? "").trim() }, { scroll: true });
  }

  function applyFilters(values: MerchFilterValues) {
    updateQuery({ ...values }, { scroll: true });
    setFiltersOpen(false);
  }

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setSearchParams(writeMerchQuery({ ...query, page: clamped }));
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  const from = data.count === 0 ? 0 : (query.page - 1) * MERCH_PAGE_SIZE + 1;
  const to = data.count === 0 ? 0 : from + data.results.length - 1;

  return (
    <main className="mp-page">
      <div className="mp-container">
        <header className="mp-hero">
          <div className="mp-hero-decor" aria-hidden="true">
            <PawPrint className="mp-decor mp-decor-paw" size={34} />
            <Sparkles className="mp-decor mp-decor-sparkle" size={22} />
          </div>

          <nav className="mp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Merchandise</span>
          </nav>

          <p className="mp-eyebrow">Everything for your pet</p>
          <h1>Pet Merchandise</h1>
          <p className="mp-hero-sub">
            Products from verified vendors across Uganda.
          </p>

          {/* key: remounts the form so the box follows chip removals and "Clear all" */}
          <form
            key={query.search}
            className="mp-search"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <Search size={22} aria-hidden="true" />
            <input
              name="search"
              type="search"
              aria-label="Search merchandise"
              placeholder="Search products by name…"
              defaultValue={query.search}
            />
            <button type="submit" aria-label="Search merchandise">
              <ArrowRight size={21} aria-hidden="true" />
            </button>
          </form>
        </header>
      </div>

      <section
        className="mp-container mp-results"
        ref={resultsRef}
        aria-labelledby="mp-results-title"
      >
        <div className="mp-results-layout">
          <div
            className={`mp-backdrop${filtersOpen ? " is-open" : ""}`}
            onClick={() => setFiltersOpen(false)}
            aria-hidden="true"
          />

          <aside className="mp-sidebar">
            {/* key: remounts the panel so its draft resets to the applied filters */}
            <MerchFilters
              key={paramsKey}
              applied={query}
              categories={categories}
              onApply={applyFilters}
              onClear={clearAll}
              onClose={() => setFiltersOpen(false)}
              open={filtersOpen}
              canClear={hasCriteria || query.sort !== "newest"}
            />
          </aside>

          <div className="mp-results-main">
            <div className="mp-results-head">
              <div>
                <h2 id="mp-results-title">
                  {hasCriteria ? "Matching products" : "All products"}
                </h2>
                <p className="mp-results-count" aria-live="polite">
                  {status === "loading"
                    ? "Finding products…"
                    : data.count === 0
                      ? "No products found"
                      : `Showing ${from}–${to} of ${data.count.toLocaleString("en-UG")} products`}
                </p>
              </div>
              <button
                type="button"
                className="mp-filter-toggle"
                onClick={() => setFiltersOpen(true)}
                aria-expanded={filtersOpen}
                aria-controls={MERCH_FILTERS_ID}
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
                Filters &amp; sort
                {filterCount > 0 && (
                  <span className="mp-badge">{filterCount}</span>
                )}
              </button>
            </div>

            <ActiveFilterChips
              chips={chips}
              onRemove={removeChip}
              onClearAll={clearAll}
            />

            {status === "loading" ? (
              <MerchGrid products={[]} loading />
            ) : status === "error" ? (
              <EmptyState
                role="alert"
                icon={<ShoppingBag size={34} />}
                title="We couldn’t load the products"
                text="Something went wrong on our side. Please try again."
              >
                <Button onClick={() => setReloadKey((k) => k + 1)}>
                  Try again
                </Button>
              </EmptyState>
            ) : data.results.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag size={34} />}
                title={
                  hasCriteria
                    ? "No products match these filters"
                    : "No products listed yet"
                }
                text={
                  hasCriteria
                    ? "Try removing a filter, or check the spelling of your search."
                    : "Vendors add new products every day. Check back soon."
                }
              >
                {hasCriteria && (
                  <Button onClick={clearAll}>Clear search and filters</Button>
                )}
              </EmptyState>
            ) : (
              <MerchGrid
                key={`${query.page}-${query.sort}`}
                products={data.results}
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

      <Reveal className="mp-container mp-section">
        <CommonCtaBanner
          eyebrow="For pet businesses"
          title="Sell your pet products on Pawdigree"
          text="Become a Pawdigree vendor and reach pet owners across Uganda."
          href="/vendor"
          actionLabel="Become a vendor"
        />
      </Reveal>
    </main>
  );
}

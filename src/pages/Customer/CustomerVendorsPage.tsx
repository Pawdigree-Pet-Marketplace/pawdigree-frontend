import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Store } from "lucide-react";
import API_BASE_URL from "../../services/api";
import "./CustomerVendorsPage.css";

type PublicVendor = {
  id: number | string;
  name: string;
  description?: string | null;
  address?: string | null;
  city_district?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  categories?: string[];
};

function readVendors(data: unknown): PublicVendor[] {
  const rows = Array.isArray(data)
    ? data
    : (data as { results?: unknown } | null)?.results;
  if (!Array.isArray(rows)) return [];
  return rows.filter(
    (row): row is PublicVendor =>
      !!row &&
      (typeof row.id === "number" || typeof row.id === "string") &&
      typeof row.name === "string",
  );
}

function imageUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function CustomerVendorsPage() {
  const [vendors, setVendors] = useState<PublicVendor[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadVendors() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/businesses/public/`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            `We couldn't load vendors (HTTP ${response.status}). Please try again.`,
          );
        setVendors(readVendors(await response.json()));
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "We couldn't load vendors. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadVendors();
    return () => controller.abort();
  }, [retryKey]);

  const visibleVendors = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return vendors;
    return vendors.filter((vendor) =>
      [
        vendor.name,
        vendor.description,
        vendor.city_district,
        vendor.address,
        ...(vendor.categories ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [vendors, query]);

  return (
    <div className="vendors-shell">
      <main className="vendors-page">
        <section className="vendors-intro">
          <span className="vendors-eyebrow">
            <Store size={16} /> PAWDIGREE MARKETPLACE
          </span>
          <h1>Meet our vendors</h1>
          <p>Find trusted pet businesses and the people who care for them.</p>
          <label className="vendors-search">
            <Search size={20} aria-hidden="true" />
            <span className="visually-hidden">Search vendors</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, category, or location"
            />
          </label>
        </section>
        <section className="vendors-results" aria-live="polite">
          {!loading && !error && (
            <p className="vendors-count">
              {visibleVendors.length}{" "}
              {visibleVendors.length === 1 ? "vendor" : "vendors"}
            </p>
          )}
          {loading ? (
            <div className="vendors-grid" aria-label="Loading vendors">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="vendor-skeleton" key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="vendors-state" role="alert">
              <h2>Vendors are unavailable</h2>
              <p>{error}</p>
              <button onClick={() => setRetryKey((key) => key + 1)}>
                Try again
              </button>
            </div>
          ) : visibleVendors.length === 0 ? (
            <div className="vendors-state">
              <h2>{query.trim() ? "No matching vendors" : "No vendors yet"}</h2>
              <p>
                {query.trim()
                  ? "Try another name, category, or location."
                  : "Check back soon to discover businesses on Pawdigree."}
              </p>
            </div>
          ) : (
            <div className="vendors-grid">
              {visibleVendors.map((vendor) => (
                <Link
                  className="vendor-card"
                  to={`/vendors/${encodeURIComponent(vendor.id)}`}
                  key={vendor.id}
                >
                  <div className="vendor-card-cover">
                    {vendor.cover_image && (
                      <img
                        src={imageUrl(vendor.cover_image)}
                        alt=""
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="vendor-card-body">
                    <div className="vendor-card-logo">
                      {vendor.logo ? (
                        <img
                          src={imageUrl(vendor.logo)}
                          alt={`${vendor.name} logo`}
                          loading="lazy"
                        />
                      ) : (
                        <Store size={25} aria-hidden="true" />
                      )}
                    </div>
                    <h2>{vendor.name}</h2>
                    {(vendor.city_district || vendor.address) && (
                      <p className="vendor-location">
                        <MapPin size={15} />
                        {vendor.city_district || vendor.address}
                      </p>
                    )}
                    {vendor.categories && vendor.categories.length > 0 && (
                      <ul className="vendor-categories">
                        {vendor.categories.slice(0, 3).map((category) => (
                          <li key={category}>{category}</li>
                        ))}
                      </ul>
                    )}
                    {vendor.description && (
                      <p className="vendor-description">{vendor.description}</p>
                    )}
                    <span className="vendor-card-link">
                      View vendor profile <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CustomerVendorsPage;

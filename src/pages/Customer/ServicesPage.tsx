
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  MapPin,
  PawPrint,
  Search,
  Stethoscope,
  Star,
} from "lucide-react";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import {
  SERVICE_PAGE_SIZE,
  type Service,
} from "../../data/services";
import {
  fetchServices,
  getCategories,
} from "../../services/publicServicesApi";
import "./ServicesPage.css";

interface ServiceCategory {
  id: number;
  name: string;
}

interface ServiceFilters {
  search: string;
  category: string;
  cityDistrict: string;
  minPrice: string;
  maxPrice: string;
  page: number;
}

function readFilters(params: URLSearchParams): ServiceFilters {
  return {
    search: params.get("search") ?? "",
    category: params.get("category") ?? "",
    cityDistrict: params.get("city_district") ?? "",
    minPrice: params.get("min_price") ?? "",
    maxPrice: params.get("max_price") ?? "",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

function writeFilters(filters: ServiceFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.cityDistrict) {
    params.set("city_district", filters.cityDistrict);
  }
  if (filters.minPrice) params.set("min_price", filters.minPrice);
  if (filters.maxPrice) params.set("max_price", filters.maxPrice);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

function formatPrice(price: string): string {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return `UGX ${price}`;

  return `UGX ${amount.toLocaleString("en-UG")}`;
}

function formatDuration(duration: number): string {
  if (!duration || duration < 1) return "Duration not specified";

  if (duration >= 60) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return minutes
      ? `${hours} hr ${minutes} min`
      : `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${duration} minutes`;
}

function ServiceCard({ service }: { service: Service }) {
  const available = service.availability_status?.toLowerCase() === "available";

  return (
    <article className="services-card">
      <div className="services-card-image">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            loading="lazy"
          />
        ) : (
          <div className="services-image-placeholder">
            <Stethoscope size={42} aria-hidden="true" />
            <span>Pet service</span>
          </div>
        )}

        <span
          className={`services-availability ${
            available ? "is-available" : "is-unavailable"
          }`}
        >
          {service.availability_status || "Availability unknown"}
        </span>
      </div>

      <div className="services-card-content">
        <div className="services-card-category">
          {service.category_name || service.service_type || "Pet service"}
        </div>

        <h3>{service.name}</h3>

        <p className="services-card-description">
          {service.description || "Contact the business for more information."}
        </p>

        <div className="services-card-business">
          <PawPrint size={16} aria-hidden="true" />
          <span>{service.business_name || "Verified Pawdigree business"}</span>
        </div>

        <div className="services-card-meta">
          <span>
            <MapPin size={15} aria-hidden="true" />
            {service.city_district || "Location not specified"}
          </span>

          <span>
            <Clock size={15} aria-hidden="true" />
            {formatDuration(service.duration)}
          </span>
        </div>

        <div className="services-card-rating">
          <Star size={15} fill="currentColor" aria-hidden="true" />
          {Number(service.average_rating || 0).toFixed(1)}
          <span>({service.review_count || 0} reviews)</span>
        </div>

        <div className="services-card-footer">
          <strong>{formatPrice(service.price)}</strong>
          <span className="services-card-contact">
            {available ? "Available" : "Check availability"}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();

  const filters = useMemo(
    () => readFilters(new URLSearchParams(paramsKey)),
    [paramsKey],
  );

  const [services, setServices] = useState<Service[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const updateFilters = useCallback(
    (patch: Partial<ServiceFilters>) => {
      setSearchParams(
        writeFilters({
          ...filters,
          ...patch,
          page: 1,
        }),
      );
    },
    [filters, setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;

    fetchServices(filters)
      .then((response) => {
        if (cancelled) return;

        setServices(response.results);
        setTotalCount(response.count);
      })
      .catch(() => {
        if (cancelled) return;

        setServices([]);
        setTotalCount(0);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    getCategories("services")
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / SERVICE_PAGE_SIZE),
  );

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.category) ||
    Boolean(filters.cityDistrict) ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice);

  const from =
    totalCount === 0
      ? 0
      : (filters.page - 1) * SERVICE_PAGE_SIZE + 1;

  const to =
    totalCount === 0
      ? 0
      : from + services.length - 1;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const search = String(formData.get("search") ?? "").trim();

    updateFilters({ search });
  }

  function clearFilters() {
    setSearchParams({});
  }

  function goToPage(page: number) {
    setSearchParams(
      writeFilters({
        ...filters,
        page,
      }),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="services-page">
      <div className="services-container">
        <header className="services-hero">
          <div className="services-hero-decoration" aria-hidden="true">
            <PawPrint size={55} />
            <Stethoscope size={38} />
          </div>

          <nav className="services-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span aria-current="page">Pet Services</span>
          </nav>

          <p className="services-eyebrow">Care for every paw</p>

          <h1>Find the Right Care for Your Pet</h1>

          <p className="services-hero-description">
            Discover pet services from approved businesses across Uganda.
            Find the care your furry friend deserves.
          </p>

          <form
            key={filters.search}
            className="services-search"
            role="search"
            onSubmit={handleSearch}
          >
            <Search size={21} aria-hidden="true" />

            <input
              type="search"
              name="search"
              placeholder="Search grooming, veterinary care..."
              aria-label="Search pet services"
              defaultValue={filters.search}
            />

            <button type="submit" aria-label="Search services">
              <ArrowRight size={21} />
            </button>
          </form>
        </header>

        <section className="services-content" aria-labelledby="services-heading">
          <aside className="services-filter-panel">
            <div className="services-filter-heading">
              <h2>Filter services</h2>

              {hasFilters && (
                <button type="button" onClick={clearFilters}>
                  Clear all
                </button>
              )}
            </div>

            <div className="services-filter-field">
              <label htmlFor="service-category">Category</label>

              <select
                id="service-category"
                value={filters.category}
                onChange={(event) =>
                  updateFilters({ category: event.target.value })
                }
              >
                <option value="">All categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="services-filter-field">
              <label htmlFor="service-district">City or district</label>

              <input
                id="service-district"
                type="text"
                placeholder="e.g. Kampala"
                value={filters.cityDistrict}
                onChange={(event) =>
                  updateFilters({ cityDistrict: event.target.value })
                }
              />
            </div>

            <div className="services-filter-field">
              <label>Price range (UGX)</label>

              <div className="services-price-inputs">
                <input
                  type="number"
                  min="0"
                  placeholder="Minimum"
                  aria-label="Minimum service price"
                  value={filters.minPrice}
                  onChange={(event) =>
                    updateFilters({ minPrice: event.target.value })
                  }
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Maximum"
                  aria-label="Maximum service price"
                  value={filters.maxPrice}
                  onChange={(event) =>
                    updateFilters({ maxPrice: event.target.value })
                  }
                />
              </div>
            </div>

            <p className="services-filter-note">
              Prices and availability are provided by the service businesses.
            </p>
          </aside>

          <div className="services-results">
            <div className="services-results-heading">
              <div>
                <h2 id="services-heading">
                  {hasFilters ? "Matching services" : "Explore pet services"}
                </h2>

                <p aria-live="polite">
                  {loading
                    ? "Finding services..."
                    : `Showing ${from}–${to} of ${totalCount.toLocaleString(
                        "en-UG",
                      )} services`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="services-message" role="status">
                <div className="services-loader" />
                <p>Finding pet services for you...</p>
              </div>
            ) : error ? (
              <EmptyState
                role="alert"
                icon={<Stethoscope size={34} />}
                title="We couldn't load pet services"
                text="Something went wrong while loading services. Please try again."
              >
                <Button onClick={() => setReloadKey((key) => key + 1)}>
                  Try again
                </Button>
              </EmptyState>
            ) : services.length === 0 ? (
              <EmptyState
                icon={<Stethoscope size={34} />}
                title={
                  hasFilters
                    ? "No services match your search"
                    : "No services available yet"
                }
                text={
                  hasFilters
                    ? "Try changing your search or removing some filters."
                    : "Approved pet businesses will appear here when they list their services."
                }
              >
                {hasFilters && (
                  <Button onClick={clearFilters}>
                    Clear search and filters
                  </Button>
                )}
              </EmptyState>
            ) : (
              <div className="services-grid">
                {services.map((service) => (
                  <ServiceCard
                    key={service.service_id}
                    service={service}
                  />
                ))}
              </div>
            )}

            {!loading && !error && totalPages > 1 && (
              <Pagination
                page={filters.page}
                totalPages={totalPages}
                onChange={goToPage}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

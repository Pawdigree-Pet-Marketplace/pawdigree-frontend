
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  PawPrint,
  Star,
  Store,
} from "lucide-react";

import { fetchServiceById } from "../../services/publicServicesApi";
import type { Service } from "../../data/services";
import "./ServiceDetailsPage.css";

function formatPrice(price: string): string {
  const amount = Number(price);

  if (Number.isNaN(amount)) {
    return `UGX ${price}`;
  }

  return `UGX ${amount.toLocaleString("en-UG")}`;
}

function formatDuration(duration: number): string {
  if (duration < 60) {
    return `${duration} minutes`;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} hr ${minutes} min`;
}

/* Shared Pawdigree-style banner */
function ServiceDetailsHero() {
  return (
    <header className="service-details-hero">
      <div
        className="service-details-hero-decoration"
        aria-hidden="true"
      >
        <PawPrint size={58} />
        <PawPrint size={38} />
      </div>

      <nav
        className="service-details-breadcrumb"
        aria-label="Breadcrumb"
      >
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/services">Pet Services</Link>
        <span>/</span>
        <span aria-current="page">Service Details</span>
      </nav>

      <p className="service-details-eyebrow">
        Care for every paw
      </p>

      <h1>Discover the Care Your Pet Deserves</h1>

      <p className="service-details-hero-description">
        Explore service information, pricing, availability and the
        business providing the care.
      </p>
    </header>
  );
}

function ServiceDetailsPage() {
  const { serviceId } = useParams<{ serviceId: string }>();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      if (!serviceId) {
        setError("The service ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchServiceById(serviceId);

        if (!cancelled) {
          setService(data);
        }
      } catch {
        if (!cancelled) {
          setError(
            "We could not load this service. It may no longer be available."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadService();

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  /* Loading state */
  if (loading) {
    return (
      <main className="service-details-page">
        <ServiceDetailsHero />

        <div className="service-details-message">
          <div className="service-details-spinner" />
          <p>Loading service details...</p>
        </div>
      </main>
    );
  }

  /* Error or unavailable state */
  if (error || !service) {
    return (
      <main className="service-details-page">
        <ServiceDetailsHero />

        <div className="service-details-message">
          <PawPrint size={42} />

          <h2>Service unavailable</h2>

          <p>
            {error || "We could not find this service."}
          </p>

          <Link
            to="/services"
            className="service-details-back-button"
          >
            <ArrowLeft size={18} />
            Back to services
          </Link>
        </div>
      </main>
    );
  }

  const available =
    service.availability_status?.toLowerCase() === "available";

  /* Successfully loaded service details */
  return (
    <main className="service-details-page">
      <ServiceDetailsHero />

      <div className="service-details-container">
        <Link
          to="/services"
          className="service-details-back-link"
        >
          <ArrowLeft size={18} />
          Back to services
        </Link>

        <div className="service-details-content">
          {/* Service image */}
          <div className="service-details-image-section">
            {service.image ? (
              <img
                src={service.image}
                alt={service.name}
                className="service-details-image"
              />
            ) : (
              <div className="service-details-image-placeholder">
                <PawPrint size={76} />
                <span>Pet Care Service</span>
              </div>
            )}
          </div>

          {/* Service information */}
          <section className="service-details-information">
            <div className="service-details-category">
              {service.category_name || service.service_type}
            </div>

            <div className="service-details-title-row">
              <h2>{service.name}</h2>

              <span
                className={`service-details-status ${
                  available
                    ? "is-available"
                    : "is-unavailable"
                }`}
              >
                {service.availability_status ||
                  "Availability not specified"}
              </span>
            </div>

            {/* Rating */}
            <div className="service-details-rating">
              <Star size={18} fill="currentColor" />

              <strong>
                {Number(
                  service.average_rating || 0
                ).toFixed(1)}
              </strong>

              <span>
                ({service.review_count || 0}{" "}
                {(service.review_count || 0) === 1
                  ? "review"
                  : "reviews"}
                )
              </span>
            </div>

            {/* Price */}
            <div className="service-details-price">
              {formatPrice(service.price)}
            </div>

            {/* Duration and location */}
            <div className="service-details-facts">
              <div className="service-details-fact">
                <Clock3 size={20} />

                <div>
                  <span>Duration</span>
                  <strong>
                    {formatDuration(service.duration)}
                  </strong>
                </div>
              </div>

              <div className="service-details-fact">
                <MapPin size={20} />

                <div>
                  <span>Location</span>
                  <strong>
                    {service.city_district || "Not specified"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="service-details-description">
              <h3>About this service</h3>

              <p>
                {service.description ||
                  "No description has been provided."}
              </p>
            </div>

            {/* Service provider */}
            <div className="service-details-vendor">
              <Store size={22} />

              <div>
                <span>Provided by</span>

                <strong>
                  {service.business_name ||
                    "Vendor not specified"}
                </strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default ServiceDetailsPage;

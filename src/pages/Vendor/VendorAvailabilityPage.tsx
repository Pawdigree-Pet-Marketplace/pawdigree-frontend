import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarDays, Clock3, LoaderCircle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import "./VendorAvailabilityPage.css";

type VendorService = {
  service_id: number;
  name: string;
  service_type?: string;
  description?: string;
  price?: string | number | null;
  duration?: number | null;
  availability_status?: string;
  category_status?: string | null;
};

type ServicesResponse = VendorService[] | { results?: VendorService[] };

async function readError(response: Response): Promise<string> {
  if (response.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const message = Object.entries(data as Record<string, unknown>)
      .map(([field, value]) =>
        `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`
      )
      .join("\n");

    if (message) return message;
  }

  return `Request failed (${response.status}). Please try again.`;
}

export default function VendorAvailabilityPage() {
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Manage Availability - Pawdigree";

    let cancelled = false;

    async function loadServices() {
      try {
        const response = await vendorAuthenticatedFetch(
          `${API_BASE_URL}/api/services/`
        );

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const data = (await response.json()) as ServicesResponse;
        const serviceOptions = Array.isArray(data)
          ? data
          : data.results ?? [];

        if (!cancelled) {
          setServices(serviceOptions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your services. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  function formatPrice(price: string | number | null | undefined) {
    if (price === null || price === undefined || price === "") {
      return "Price not set";
    }

    return `UGX ${Number(price).toLocaleString("en-UG")}`;
  }

  return (
    <VendorLayout
      title="Availability"
      description="Choose a service to manage the days and times customers can book."
      vendorWorkspace
    >
      <div className="dashboard-content vendor-availability-page">
        <BackButton
          fallback="/vendor/dashboard"
          label="Back to dashboard"
        />

        <section className="availability-intro">
          <div className="availability-intro-icon">
            <CalendarDays size={23} />
          </div>
          <div>
            <h2>Manage your service availability</h2>
            <p>
              Select one of your services to set the days and time slots
              when customers can book appointments.
            </p>
          </div>
        </section>

        {loading && (
          <p className="availability-message" role="status">
            <LoaderCircle className="availability-spinner" size={19} />
            Loading your services...
          </p>
        )}

        {error && (
          <p className="availability-message error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && services.length === 0 && (
          <section className="availability-empty-state">
            <BriefcaseBusiness size={34} />
            <h2>No services available yet</h2>
            <p>
              Add a service to your business first. You can then manage
              its booking days and time slots here.
            </p>
            <Link to="/vendor/services/new" className="availability-add-link">
              Add a service
            </Link>
          </section>
        )}

        {!loading && services.length > 0 && (
          <section className="availability-services">
            <div className="availability-section-heading">
              <div>
                <h2>Your services</h2>
                <p>
                  {services.length} {services.length === 1 ? "service" : "services"} found
                </p>
              </div>
            </div>

            <div className="availability-service-grid">
              {services.map((service) => (
                <article
                  className="availability-service-card"
                  key={service.service_id}
                >
                  <div className="availability-service-icon">
                    <BriefcaseBusiness size={21} />
                  </div>

                  <div className="availability-service-details">
                    <h3>{service.name}</h3>
                    <p className="availability-service-type">
                      {service.service_type || "Pet care service"}
                    </p>

                    <div className="availability-service-meta">
                      <span>
                        <Wallet size={15} />
                        {formatPrice(service.price)}
                      </span>

                      <span>
                        <Clock3 size={15} />
                        {service.duration
                          ? `${service.duration} minutes`
                          : "Duration not set"}
                      </span>
                    </div>

                    {service.category_status === "pending" && (
                      <p className="availability-pending-note">
                        Category approval pending
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/vendor/services/${service.service_id}/availability`}
                    className="availability-manage-link"
                  >
                    Manage Availability
                    <CalendarDays size={17} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </VendorLayout>
  );
}

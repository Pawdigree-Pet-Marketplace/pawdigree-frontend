import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarDays, Clock3, LoaderCircle, Pencil, Plus, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";
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
  business?: string | number;
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

export default function VendorAvailabilityPage({ view = "availability" }: { view?: "availability" | "catalog" }) {
  const isCatalog = view === "catalog";
  const activeBusiness = useVendorBusiness();
  const activeBusinessId = activeBusiness ? String(activeBusiness.id) : null;
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Manage Availability - Pawdigree";

    let cancelled = false;

    async function loadServices() {
      try {
        const response = await vendorAuthenticatedFetch(
          `${API_BASE_URL}/api/services/${activeBusinessId ? `?business_id=${encodeURIComponent(activeBusinessId)}` : ""}`
        );

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const data = (await response.json()) as ServicesResponse;
        const fetchedServices = Array.isArray(data)
          ? data
          : data.results ?? [];
        const serviceOptions = activeBusinessId
          ? fetchedServices.filter((service) => String(service.business) === activeBusinessId)
          : fetchedServices;

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
  }, [activeBusinessId]);

  function formatPrice(price: string | number | null | undefined) {
    if (price === null || price === undefined || price === "") {
      return "Price not set";
    }

    return `UGX ${Number(price).toLocaleString("en-UG")}`;
  }

  return (
    <VendorLayout
      title={isCatalog ? "Service Catalog" : "Availability"}
      description={isCatalog ? "View and manage the services offered by this business." : "Choose a service to manage the days and times customers can book."}
      vendorWorkspace
    >
      <div className="dashboard-content vendor-availability-page">
        <BackButton
          fallback={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "dashboard") : "/vendor/dashboard"}
          label="Back to dashboard"
        />

        <section className="availability-intro">
          <div className="availability-intro-icon">
            <CalendarDays size={23} />
          </div>
          <div className="availability-intro-copy">
            <h2>{isCatalog ? "Your services" : "Manage your service availability"}</h2>
            <p>{isCatalog
              ? "Review your registered services, edit their details, or update when customers can book."
              : "Select one of your services to set the days and time slots when customers can book appointments."}</p>
          </div>
          {isCatalog && activeBusiness && (
            <Link to={vendorBusinessPath(String(activeBusiness.id), "services/new")} className="availability-add-link">
              <Plus size={16} /> Add service
            </Link>
          )}
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
            {(!activeBusiness || activeBusiness.business_type === "SERVICE_PROVIDER") && (
              <Link to={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "services/new") : "/vendor/services/new"} className="availability-add-link">
                Add a service
              </Link>
            )}
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

                  <div className="availability-service-actions">
                    {isCatalog && activeBusiness && (
                      <Link
                        to={vendorBusinessPath(String(activeBusiness.id), `services/${service.service_id}/edit`)}
                        className="availability-manage-link"
                      >
                        Edit service
                        <Pencil size={17} />
                      </Link>
                    )}
                    <Link
                      to={activeBusiness
                        ? vendorBusinessPath(String(activeBusiness.id), `services/${service.service_id}/availability`)
                        : `/vendor/services/${service.service_id}/availability`}
                      className="availability-manage-link"
                    >
                      {isCatalog ? "Manage availability" : "Manage Availability"}
                      <CalendarDays size={17} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </VendorLayout>
  );
}

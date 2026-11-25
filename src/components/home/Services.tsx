import { useEffect, useState } from "react";
import { Clock3, MapPin, PawPrint, Star, Stethoscope } from "lucide-react";
import useScrollReveal from "../../hooks/useScrollReveal";
import { fetchServices } from "../../services/publicServicesApi";
import type { Service } from "../../data/services";
import { Link } from "react-router-dom";
import "./Services.css";

function formatPrice(value: string) {
  if (!value) return "Price not specified";
  const amount = Number(value);
  return Number.isFinite(amount) ? `UGX ${amount.toLocaleString("en-UG")}` : `UGX ${value}`;
}

function formatDuration(minutes: number) {
  if (!minutes) return "Duration not specified";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function HomeServiceCard({ service, index }: { service: Service; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const available = service.availability_status?.toLowerCase() === "available";
  return (
    <Link
      to={`/services/${service.service_id}`}
      className={`service-card home-service-card reveal reveal-delay-${Math.min(index + 1, 4)}`}
    >
      <div className={`service-media${!service.image || imageFailed ? " service-media-fallback" : ""}`}>
        {service.image && !imageFailed ? <img src={service.image} alt={service.name} className="service-image" loading="lazy" onError={() => setImageFailed(true)} /> : <><Stethoscope size={42} aria-hidden="true" /><span>Pet service</span></>}
        <span className={`home-service-availability${available ? " is-available" : " is-unavailable"}`}>{service.availability_status || "Availability unknown"}</span>
      </div>
      <div className="home-service-content">
        <p className="home-service-category">{service.category_name || service.service_type || "Pet service"}</p>
        <h3>{service.name}</h3>
        <p className="home-service-description">{service.description || "Contact the business for more information."}</p>
        <p className="home-service-business"><PawPrint size={15} aria-hidden="true" />{service.business_name || "Pawdigree business"}</p>
        <div className="home-service-meta">
          <span><MapPin size={14} aria-hidden="true" />{service.city_district || "Location not specified"}</span>
          <span><Clock3 size={14} aria-hidden="true" />{formatDuration(service.duration)}</span>
        </div>
        <div className="home-service-footer">
          <strong>{formatPrice(service.price)}</strong>
          {(service.review_count > 0 || service.average_rating > 0) && <span className="home-service-rating"><Star size={14} fill="currentColor" aria-hidden="true" />{Number(service.average_rating || 0).toFixed(1)} ({service.review_count || 0})</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const servicesRef = useScrollReveal<HTMLDivElement>(services);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchServices({ search: "", category: "", cityDistrict: "", minPrice: "", maxPrice: "", page: 1 })
      .then((response) => {
        if (cancelled) return;
        setServices(response.results.slice(0, 4));
        setFailed(false);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [retryCount]);

  return (
    <section className="container section home-services-section" id="services">
      <div className="section-header">
        <div><h2 className="section-title">Pet services</h2><p className="home-services-intro">Explore care and services listed by Pawdigree businesses.</p></div>
        <Link to="/services" className="section-link">See All Services</Link>
      </div>

      <div className="services-grid" ref={servicesRef}>
        {loading && <p className="home-services-state" role="status">Loading public services…</p>}
        {!loading && failed && <div className="home-services-state" role="alert"><p>We couldn’t load services right now.</p><button type="button" onClick={() => { setFailed(false); setLoading(true); setRetryCount((count) => count + 1); }}>Try again</button></div>}
        {!loading && !failed && services.length === 0 && <p className="home-services-state" role="status">No public services are available yet.</p>}
        {!loading && !failed && services.map((service, index) => <HomeServiceCard key={service.service_id} service={service} index={index} />)}
      </div>

      <div className="home-vendor-discovery"><span>Looking for a specific business?</span><Link to="/vendors">Meet our vendors <span aria-hidden="true">→</span></Link></div>
    </section>
  );
}

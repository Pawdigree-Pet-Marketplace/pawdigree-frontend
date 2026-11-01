import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  Clock,
  BadgeCheck,
  Share2,
  PawPrint,
  Store,
} from "lucide-react";
import VendorSidebar from "../../components/vendor/VendorSidebar/VendorSidebar";
import VendorTopbar from "../../components/vendor/VendorTopbar/VendorTopbar";
import VendorPageHeader from "../../components/vendor/VendorPageHeader/VendorPageHeader";
import VendorBusinessUpdateForm, {
  type Business,
} from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";
import { type PublicPet } from "../../data/pets";
import API_BASE_URL, { apiRequest } from "../../services/api";
import { fetchPetsByBusiness } from "../../services/petsApi";
import "./VendorBusinessProfilePage.css";

interface Verification {
  status?: string;
  last_verified?: string;
}

type CatTab = "all" | "pets" | "products" | "services";
type BusinessListResponse = Business[] | (Business & { results?: Business[] });

type PageState = {
  status: "loading" | "ready" | "error";
  business: Business | null;
  verification: Verification | null;
};

/* ---------- helpers ---------- */

function imageUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function petImage(pet: PublicPet) {
  const img =
    pet.images?.find((i) => i.is_primary)?.image || pet.images?.[0]?.image;
  return imageUrl(img);
}

const capDay = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const cap = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending";

function formatDate(d: string) {
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? d
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatHours(hours: unknown): { day: string; time: string }[] {
  if (!hours) return [];
  if (typeof hours === "object" && !Array.isArray(hours)) {
    return Object.entries(hours as Record<string, unknown>).map(
      ([day, val]) => {
        let time = "";
        if (!val) time = "Closed";
        else if (typeof val === "string") time = val;
        else if (typeof val === "object") {
          const v = val as Record<string, unknown>;
          if (v.is_open === false || v.is_closed || v.closed || v.isClosed)
            time = "Closed";
          else if (v.open && v.close)
            time = `${String(v.open)} - ${String(v.close)}`;
          else if (v.start && v.end)
            time = `${String(v.start)} - ${String(v.end)}`;
          else if (v.from && v.to) time = `${String(v.from)} - ${String(v.to)}`;
          else if (v.time) time = String(v.time);
          else time = Object.values(v).join(" - ");
        }
        return { day, time };
      },
    );
  }
  if (typeof hours === "string" && hours.includes(":")) {
    return hours
      .split(",")
      .map((s) => {
        const parts = s.trim().split(":");
        return {
          day: (parts[0] || "").trim(),
          time: parts.slice(1).join(":").trim(),
        };
      })
      .filter((h) => h.day);
  }
  return [];
}

/** Plain stand-in shown when an image is missing. Replace with real art later. */
function ImageFallback({ kind }: { kind: "cover" | "logo" | "pet" }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        minHeight: kind === "pet" ? 120 : undefined,
        display: "grid",
        placeItems: "center",
        background: "var(--teal-light, #E7F1F0)",
        color: "var(--teal, #1B6F63)",
      }}
    >
      {kind === "pet" ? (
        <PawPrint size={36} />
      ) : (
        <Store size={kind === "logo" ? 30 : 44} />
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function VendorBusinessProfilePage() {
  const [tab, setTab] = useState<"view" | "edit">("view");
  const [state, setState] = useState<PageState>({
    status: "loading",
    business: null,
    verification: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest<BusinessListResponse>("/businesses/");
        const business = Array.isArray(data)
          ? (data[0] ?? null)
          : (data.results?.[0] ?? data);
        const verification = await apiRequest<Verification>(
          "/businesses/verification-status/",
        ).catch(() => null);
        if (!cancelled) {
          setState({
            status: "ready",
            business: business?.id ? business : null,
            verification,
          });
        }
      } catch {
        if (!cancelled)
          setState({ status: "error", business: null, verification: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="vendor-layout">
      <VendorSidebar />
      <div className="vendor-main">
        <VendorTopbar />
        <VendorPageHeader
          title="Store Profile"
          description="View and manage your business information"
        />
        <div className="bp-page">
          <div className="bp-mode-tabs">
            <button
              className={tab === "view" ? "active" : ""}
              onClick={() => setTab("view")}
            >
              View
            </button>
            <button
              className={tab === "edit" ? "active" : ""}
              onClick={() => setTab("edit")}
            >
              Edit
            </button>
          </div>

          {state.status === "loading" ? (
            <div className="bp-empty-card" role="status">
              <p>Loading your business profile…</p>
            </div>
          ) : state.status === "error" ? (
            <div className="bp-empty-card" role="alert">
              <h3>We couldn't load your profile</h3>
              <p>Please check your connection and refresh the page.</p>
            </div>
          ) : tab === "view" ? (
            <VendorProfileView
              business={state.business}
              verification={state.verification}
              onEdit={() => setTab("edit")}
            />
          ) : (
            <VendorBusinessUpdateForm
              business={state.business}
              onSaved={(b) => {
                setState((prev) => ({ ...prev, business: b }));
                setTab("view");
              }}
              onCancel={() => setTab("view")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- view ---------- */

type ViewProps = {
  business: Business | null;
  verification: Verification | null;
  onEdit: () => void;
};

type PetsLoaded = { key: string; pets: PublicPet[] | null };

function VendorProfileView({ business, verification, onEdit }: ViewProps) {
  const [copied, setCopied] = useState(false);
  const [catTab, setCatTab] = useState<CatTab>("all");
  const [showAll, setShowAll] = useState(false);
  const [petsLoaded, setPetsLoaded] = useState<PetsLoaded | null>(null);

  const businessId = business?.id !== undefined ? String(business.id) : "";
  const name = business?.name || business?.business_name || "";

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    fetchPetsByBusiness(businessId, name)
      .then((pets) => !cancelled && setPetsLoaded({ key: businessId, pets }))
      .catch(
        () => !cancelled && setPetsLoaded({ key: businessId, pets: null }),
      );
    return () => {
      cancelled = true;
    };
  }, [businessId, name]);

  if (!business) {
    return (
      <div className="bp-empty-card">
        <h3>No business profile yet</h3>
        <p>Add your business information to start selling on Pawdigree.</p>
        <button className="primary-btn" onClick={onEdit}>
          Create Business Profile
        </button>
      </div>
    );
  }

  const loadedForThis = petsLoaded?.key === businessId ? petsLoaded : null;
  const loadingPets = !loadedForThis;
  const pets = loadedForThis?.pets ?? [];
  const showsPets = catTab === "all" || catTab === "pets";
  const visible = showAll ? pets : pets.slice(0, 6);
  const verified = verification?.status === "verified";
  const location = business.city_district || business.location_district;
  const hours = formatHours(business.working_hours || business.business_hours);
  const cover = imageUrl(business.cover_image);
  const logo = imageUrl(business.logo);

  const changeTab = (next: CatTab) => {
    setCatTab(next);
    setShowAll(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/vendors/${business.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: `Check out ${name} on Pawdigree`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Share cancelled or clipboard unavailable
    }
  };

  return (
    <div className="bp-content">
      <div className="bp-banner-card">
        <div
          className="bp-cover"
          style={{ position: "relative", overflow: "hidden" }}
        >
          {cover ? (
            <img
              src={cover}
              alt="cover"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <ImageFallback kind="cover" />
          )}
        </div>

        <div className="bp-profile-row">
          <div className="bp-left-group">
            <div style={{ width: 80, height: 80, flexShrink: 0 }}>
              {logo ? (
                <img
                  className="bp-avatar-circle"
                  src={logo}
                  alt="logo"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid white",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "3px solid white",
                  }}
                >
                  <ImageFallback kind="logo" />
                </div>
              )}
            </div>

            <div className="bp-title" style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 16, textWrap: "nowrap" }}>
                {name}
              </h2>
              <p style={{ margin: 0, fontSize: 12.5, opacity: 0.65 }}>
                {location ? `${location} • ` : ""}
                {business.category_name || "Vendor"}
              </p>
              {verified ? (
                <span className="verified-badge">
                  <BadgeCheck size={14} /> Verified Pawdigree Vendor
                </span>
              ) : (
                <span className="pending-badge">Pending Verification</span>
              )}
            </div>
          </div>

          <span
            className="share-link-text"
            onClick={handleShare}
            role="button"
            tabIndex={0}
          >
            <Share2 size={14} /> {copied ? "Copied!" : "Share Link"}
          </span>
        </div>
      </div>

      <div className="bp-grid">
        <div className="bp-left">
          {business.description && (
            <section className="bp-card">
              <h4>ABOUT</h4>
              <p>{business.description}</p>
            </section>
          )}

          <section className="bp-card store-stats-card">
            <h4>STORE STATS</h4>
            <div className="stats-grid">
              <div className="stat-box">
                <strong className="stat-number">
                  {loadingPets ? "-" : pets.length}
                </strong>
                <span className="stat-label">Public pet listings</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">
                  {business.created_at
                    ? new Date(business.created_at).getFullYear()
                    : "-"}
                </strong>
                <span className="stat-label">Member since</span>
              </div>
            </div>
          </section>

          <section className="bp-card">
            <h4>Business Information</h4>
            <div className="info-list">
              {(business.category_name || business.vendor_category) && (
                <div>
                  <label>Category</label>
                  <p>{business.category_name || business.vendor_category}</p>
                </div>
              )}
              {location && (
                <div>
                  <label>Location</label>
                  <p>{location}</p>
                </div>
              )}
              {business.address && (
                <div>
                  <label>Address</label>
                  <p>{business.address}</p>
                </div>
              )}
              <div>
                <label>Verification</label>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className={verified ? "verified-badge" : "pending-badge"}
                    style={{ marginTop: 0 }}
                  >
                    <BadgeCheck size={14} />{" "}
                    {cap(verification?.status || "pending")}
                  </span>
                  {verification?.last_verified && (
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--gray)",
                        fontWeight: 500,
                      }}
                    >
                      Last reviewed {formatDate(verification.last_verified)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </section>

          {(business.phone ||
            business.contact ||
            business.email ||
            hours.length > 0) && (
            <section className="bp-card">
              <h4>Contact & Business Hours</h4>
              <div className="bp-contact-list">
                {(business.phone || business.contact) && (
                  <div className="bp-contact-row">
                    <Phone size={20} className="bp-contact-icon" />
                    <a
                      href={`tel:${business.phone || business.contact}`}
                      className="bp-contact-link"
                    >
                      {business.phone || business.contact}
                    </a>
                  </div>
                )}
                {business.email && (
                  <div className="bp-contact-row">
                    <Mail size={20} className="bp-contact-icon" />
                    <a
                      href={`mailto:${business.email}`}
                      className="bp-contact-link"
                    >
                      {business.email}
                    </a>
                  </div>
                )}
                {hours.length > 0 && (
                  <div className="bp-contact-row bp-hours-row">
                    <Clock size={20} className="bp-contact-icon" />
                    <div className="bp-hours-grid">
                      {hours.map((h) => (
                        <div key={h.day} className="bp-hour-item">
                          <span className="bp-hour-day">{capDay(h.day)}</span>
                          <span className="bp-hour-time">{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="bp-right">
          <section className="bp-card">
            <h4>Available Pets and Products</h4>

            <div className="category-switcher">
              {(
                [
                  ["all", "All"],
                  ["pets", "Pets"],
                  ["products", "Merchandise"],
                  ["services", "Services"],
                ] as [CatTab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={catTab === key ? "active" : ""}
                  onClick={() => changeTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {catTab === "products" || catTab === "services" ? (
              <div className="listings-placeholder">
                {catTab === "products" ? "Merchandise" : "Service"} listings are
                coming soon.
              </div>
            ) : loadingPets ? (
              <div className="listings-grid">
                <div className="listing-skeleton" />
                <div className="listing-skeleton" />
                <div className="listing-skeleton" />
              </div>
            ) : loadedForThis?.pets === null ? (
              <div className="listings-placeholder" role="alert">
                We couldn't load your pet listings right now.
              </div>
            ) : pets.length === 0 ? (
              <div className="listings-placeholder">
                No public pet listings yet
              </div>
            ) : (
              <div className="listings-grid">
                {visible.map((pet) => {
                  const img = petImage(pet);
                  return (
                    <div key={pet.pet_id} className="listing-card">
                      <div className="listing-img">
                        {img ? (
                          <img src={img} alt={pet.name} />
                        ) : (
                          <ImageFallback kind="pet" />
                        )}
                      </div>
                      <div className="listing-info">
                        <h5>{pet.name}</h5>
                        {pet.listing_type === "SALE" &&
                          pet.price != null &&
                          pet.price !== "" && (
                            <p className="listing-price">
                              UGX {Number(pet.price).toLocaleString("en-UG")}
                            </p>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showsPets && pets.length > 6 && (
              <button
                className="secondary-btn"
                onClick={() => setShowAll(!showAll)}
                style={{ width: "100%", marginTop: 12 }}
              >
                {showAll ? "Show Less" : `View all pets (${pets.length})`}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

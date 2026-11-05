import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  BadgeCheck,
  Share2,
  Check,
} from "lucide-react";
import BackButton from "../../components/BackButton/BackButton";
import { type Business } from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";
import { type PublicPet } from "../../data/pets";
import API_BASE_URL, { apiRequest } from "../../services/api";
import { fetchPetsByBusiness } from "../../services/petsApi";
import "./CustomerVendorProfilePage.css";

type Loaded = { id: string; business?: Business; pets: PublicPet[] | null };

/* ---------- helpers ---------- */

function extractList<T>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[];
  const results = (d as { results?: unknown } | null)?.results;
  return Array.isArray(results) ? (results as T[]) : [];
}

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

const formatUGX = (n?: number | string | null) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

const capDay = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

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

/** Tries the detail endpoint first, then falls back to the vendors list (known to exist). */
async function fetchBusiness(id: string): Promise<Business> {
  try {
    return await apiRequest<Business>(
      `/businesses/public/${encodeURIComponent(id)}/`,
    );
  } catch {
    const res = await apiRequest<unknown>("/businesses/public/");
    const found = extractList<Business>(res).find((b) => String(b.id) === id);
    if (!found) throw new Error("Vendor not found");
    return found;
  }
}

/* ---------- small pieces ---------- */

/** Illustrated, on-brand placeholder (echoes the logo's dog icon). */
function PlaceholderArt({ kind }: { kind: "pet" | "cover" | "logo" }) {
  const bg =
    kind === "pet" ? "var(--teal-light, #E7F1F0)" : "var(--sand, #FAF6EC)";
  const isWide = kind === "cover";
  return (
    <svg
      className="cvp-placeholder"
      viewBox={isWide ? "0 0 600 200" : "0 0 120 120"}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Placeholder illustration of a dog"
    >
      <rect width="100%" height="100%" fill={bg} />
      {isWide && (
        <>
          <circle
            cx="80"
            cy="150"
            r="70"
            fill="var(--teal, #1B6F63)"
            opacity="0.08"
          />
          <circle
            cx="540"
            cy="40"
            r="60"
            fill="var(--coral, #F2764F)"
            opacity="0.12"
          />
        </>
      )}
      <g transform={isWide ? "translate(240 20) scale(1.2)" : "translate(0 0)"}>
        <ellipse
          cx="38"
          cy="42"
          rx="12"
          ry="20"
          fill="var(--teal, #1B6F63)"
          transform="rotate(18 38 42)"
        />
        <ellipse
          cx="82"
          cy="42"
          rx="12"
          ry="20"
          fill="var(--teal, #1B6F63)"
          transform="rotate(-18 82 42)"
        />
        <circle
          cx="60"
          cy="58"
          r="26"
          fill="var(--cream, #FAF6EC)"
          stroke="var(--teal, #1B6F63)"
          strokeWidth="3"
        />
        <circle cx="51" cy="54" r="3.5" fill="var(--charcoal, #2B2B28)" />
        <circle cx="69" cy="54" r="3.5" fill="var(--charcoal, #2B2B28)" />
        <ellipse
          cx="60"
          cy="66"
          rx="6"
          ry="4.5"
          fill="var(--charcoal, #2B2B28)"
        />
        <path
          d="M54 73 Q60 79 66 73"
          stroke="var(--coral, #F2764F)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="30" cy="96" r="4" fill="var(--coral, #F2764F)" />
        <circle cx="42" cy="104" r="4" fill="var(--coral, #F2764F)" />
        <circle cx="78" cy="104" r="4" fill="var(--coral, #F2764F)" />
        <circle cx="90" cy="96" r="4" fill="var(--coral, #F2764F)" />
      </g>
    </svg>
  );
}

function SafeImage({
  src,
  alt,
  kind,
}: {
  src?: string;
  alt: string;
  kind: "pet" | "cover" | "logo";
}) {
  const [failed, setFailed] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  if (src !== lastSrc) {
    setLastSrc(src);
    setFailed(false);
  }
  if (!src || failed) return <PlaceholderArt kind={kind} />;
  return (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
  );
}

/* ---------- page ---------- */

export default function CustomerVendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const business = await fetchBusiness(id);
        const vendorName = business.name || business.business_name || "";
        const pets = await fetchPetsByBusiness(id, vendorName).catch(
          () => null,
        );
        if (!cancelled) setLoaded({ id, business, pets });
      } catch {
        if (!cancelled) setLoaded({ id, pets: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const current = loaded?.id === id ? loaded : null;
  const business = current?.business;
  const pets = current?.pets ?? [];
  const status: "loading" | "ready" | "error" = !current
    ? "loading"
    : business
      ? "ready"
      : "error";

  const raw = business as unknown as Record<string, unknown> | undefined;
  const verified =
    raw?.is_verified === true || raw?.verification_status === "approved";
  const name = business?.name || business?.business_name || "Vendor";
  const location = business?.city_district || business?.location_district;
  const hours = useMemo(
    () => formatHours(business?.working_hours || business?.business_hours),
    [business],
  );
  const visiblePets = showAll ? pets : pets.slice(0, 6);

  const handleShare = async () => {
    const url = `${window.location.origin}/vendors/${encodeURIComponent(id ?? "")}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: `Check out ${name} on Pawdigree`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share cancelled or clipboard unavailable
    }
  };

  if (status === "loading") {
    return (
      <main className="cvp-page">
        <div className="cvp-back">
          <BackButton fallback="/vendors" label="Back to vendors" />
        </div>
        <div className="cvp-listings" aria-label="Loading vendor">
          <div className="cvp-skeleton" />
          <div className="cvp-skeleton" />
          <div className="cvp-skeleton" />
        </div>
      </main>
    );
  }

  if (status === "error" || !business) {
    return (
      <main className="cvp-page">
        <div className="cvp-back">
          <BackButton fallback="/vendors" label="Back to vendors" />
        </div>
        <div className="cvp-card cvp-not-found" role="alert">
          <h3>Vendor profile unavailable</h3>
          <p>We couldn't load this vendor. They may no longer be listed.</p>
          <Link to="/vendors" className="cvp-btn primary">
            Browse vendors
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cvp-page">
      <div className="cvp-back">
        <BackButton fallback="/vendors" label="Back to vendors" />
      </div>

      {/* ---------- Banner ---------- */}
      <section className="cvp-banner-card">
        <div className="cvp-cover">
          <SafeImage
            src={imageUrl(business.cover_image)}
            alt={`${name} cover`}
            kind="cover"
          />
        </div>

        <div className="cvp-profile-row">
          <div className="cvp-avatar">
            <SafeImage
              src={imageUrl(business.logo)}
              alt={`${name} logo`}
              kind="logo"
            />
          </div>

          <div className="cvp-title">
            <h1>{name}</h1>
            <p>
              {location ? `${location} • ` : ""}
              {business.category_name || "Vendor"}
            </p>
            {verified ? (
              <span className="cvp-badge verified">
                <BadgeCheck size={14} /> Verified Pawdigree Vendor
              </span>
            ) : (
              <span className="cvp-badge pending">Not yet verified</span>
            )}
          </div>

          <div className="cvp-actions">
            <button
              type="button"
              className="cvp-btn ghost"
              onClick={handleShare}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      </section>

      <div className="cvp-grid">
        {/* ---------- Left column ---------- */}
        <div className="cvp-left">
          {business.description && (
            <section className="cvp-card">
              <h4>About</h4>
              <p>{business.description}</p>
            </section>
          )}

          <section className="cvp-card">
            <h4>Store stats</h4>
            <div className="cvp-stats">
              <div className="cvp-stat">
                <strong>{pets.length}</strong>
                <span>Pet listings</span>
              </div>
              <div className="cvp-stat">
                <strong>
                  {business.created_at
                    ? new Date(business.created_at).getFullYear()
                    : "-"}
                </strong>
                <span>Member since</span>
              </div>
            </div>
          </section>

          <section className="cvp-card">
            <h4>Business information</h4>
            <div className="cvp-info">
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
                  <p className="cvp-address">
                    <MapPin size={16} />
                    <span>{business.address}</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {(business.phone || business.email || hours.length > 0) && (
            <section className="cvp-card">
              <h4>Contact &amp; business hours</h4>
              <div className="cvp-contact">
                {business.phone && (
                  <div className="cvp-contact-row">
                    <Phone size={20} className="cvp-contact-icon" />
                    <a href={`tel:${business.phone}`}>{business.phone}</a>
                  </div>
                )}
                {business.email && (
                  <div className="cvp-contact-row">
                    <Mail size={20} className="cvp-contact-icon" />
                    <a href={`mailto:${business.email}`}>{business.email}</a>
                  </div>
                )}
                {hours.length > 0 && (
                  <div className="cvp-contact-row">
                    <Clock size={20} className="cvp-contact-icon" />
                    <div className="cvp-hours">
                      {hours.map((h) => (
                        <div key={h.day} className="cvp-hour">
                          <span className="day">{capDay(h.day)}</span>
                          <span className="time">{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ---------- Right column ---------- */}
        <div className="cvp-right">
          <section className="cvp-card">
            <h4>Available pets</h4>

            {current?.pets === null ? (
              <div className="cvp-empty" role="alert">
                We couldn't load this vendor's pets right now.
              </div>
            ) : pets.length === 0 ? (
              <div className="cvp-empty">No pets listed yet</div>
            ) : (
              <div className="cvp-listings">
                {visiblePets.map((pet) => (
                  <Link
                    key={pet.pet_id}
                    to={`/pets/${pet.pet_id}`}
                    className="cvp-listing"
                  >
                    <div className="cvp-listing-img">
                      <SafeImage
                        src={petImage(pet)}
                        alt={pet.name}
                        kind="pet"
                      />
                      <span className="cvp-kind pet">
                        {pet.listing_type === "ADOPTION"
                          ? "Adoption"
                          : "For sale"}
                      </span>
                    </div>
                    <div className="cvp-listing-info">
                      <h5 title={pet.name}>{pet.name}</h5>
                      <p>
                        {[pet.breed, pet.species].filter(Boolean).join(" · ")}
                      </p>
                      {pet.listing_type === "SALE" &&
                        pet.price != null &&
                        pet.price !== "" && (
                          <p className="cvp-price">{formatUGX(pet.price)}</p>
                        )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {pets.length > 6 && (
              <button
                type="button"
                className="cvp-btn coral block"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : `View all pets (${pets.length})`}
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

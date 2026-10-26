import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  BadgeCheck,
  Share2,
  ShoppingCart,
  MessageCircle,
  Flag,
  Star,
  CalendarCheck,
  X,
  Check,
} from "lucide-react";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";
import { type Business } from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";
import API_BASE_URL from "../../services/api";
import "./CustomerVendorProfilePage.css";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ListingKind = "pet" | "product" | "service";
type CatTab = "all" | "pets" | "products" | "services";

interface Listing {
  id: number;
  name?: string;
  title?: string;
  price?: number;
  image?: string;
  cover_image?: string;
  photo?: string;
}

interface Item extends Listing {
  kind: ListingKind;
}

interface Review {
  id: number | string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

/* ------------------------------------------------------------------ */
/* Reporting options                                                   */
/* ------------------------------------------------------------------ */

const REPORT_REASONS = [
  "Fake or misleading listings",
  "Scam or fraud",
  "Inappropriate content",
  "Poor or unsafe animal care",
  "Harassment",
  "Other",
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// The pet preview remains until the pet profile endpoint is available.

const CART_KEY = "pawdigree_cart";

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error("timeout")), ms),
    ),
  ]);

function extractList<T>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[];
  const results = (d as { results?: unknown } | null)?.results;
  return Array.isArray(results) ? (results as T[]) : [];
}

function readKeys(key: string): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeKeys(key: string, keys: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(keys));
  } catch {
    // Storage unavailable: state still works for this session
  }
}

const getToken = () =>
  localStorage.getItem("access") || localStorage.getItem("access_token");

/** call to the backend. Returns true if the server accepted it. */
async function callApi(
  path: string,
  method: "POST" | "DELETE",
  body?: unknown,
): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await withTimeout(
      fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
      5000,
    );
    return res.ok;
  } catch {
    return false;
  }
}

const itemKey = (i: Item) => `${i.kind}-${i.id}`;
const itemName = (i: Listing) => i.name || i.title || "Untitled";
const formatUGX = (n?: number) => `UGX ${(n || 0).toLocaleString()}`;

const formatDate = (d: string) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

/** Illustrated, on-brand placeholder (echoes the logo's dog icon). */
function PlaceholderArt({ kind }: { kind: ListingKind | "cover" | "logo" }) {
  const bg =
    kind === "pet"
      ? "var(--teal-light, #E7F1F0)"
      : kind === "product"
        ? "var(--coral-light, #FBD9C9)"
        : "var(--sand, #FAF6EC)";
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
  className,
}: {
  src?: string;
  alt: string;
  kind: ListingKind | "cover" | "logo";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  if (src !== lastSrc) {
    setLastSrc(src);
    setFailed(false);
  }
  if (!src || failed) return <PlaceholderArt kind={kind} />;
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span
      className="cvp-stars"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "cvp-star on" : "cvp-star"}
        />
      ))}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cvp-overlay" onClick={onClose}>
      <div
        className="cvp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cvp-modal-head">
          <h3>{title}</h3>
          <button
            type="button"
            className="cvp-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CustomerVendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vendorId = id ?? "1";

  const [business, setBusiness] = useState<Business>({});
  const [verified, setVerified] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pets, setPets] = useState<Listing[]>([]);
  const [products, setProducts] = useState<Listing[]>([]);
  const [services, setServices] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [reviews] = useState<Review[]>([]);

  const [catTab, setCatTab] = useState<CatTab>("all");
  const [showAll, setShowAll] = useState(false);
  const [cart, setCart] = useState<string[]>(() => readKeys(CART_KEY));

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<"report" | "book" | null>(null);
  const [bookingItem, setBookingItem] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  };

  /* ---- load the business + verification ---- */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = getToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      try {
        const res = await withTimeout(
          fetch(`${API_BASE_URL}/businesses/${vendorId}/`, { headers }),
          4000,
        );
        if (!res.ok && !cancelled) setNotFound(true);
        if (res.ok) {
          const data = (await res.json()) as Business;
          if (!cancelled && data?.id) {
            setBusiness(data);
            const raw = data as unknown as Record<string, unknown>;
            setVerified(
              raw.is_verified === true ||
                raw.verification_status === "approved",
            );
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  /* ---- load listings ---- */
  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const fetchList = async <T,>(url: string): Promise<T[] | null> => {
      try {
        const r = await fetch(url, { headers });
        if (!r.ok) return null;
        return extractList<T>(await r.json());
      } catch {
        return null;
      }
    };
    const run = async () => {
      const p = await fetchList<Listing>(`${API_BASE_URL}/pets/?business=${vendorId}`);
      if (cancelled) return;
      setPets(p || []);
      setProducts([]);
      setServices([]);
      setLoadingListings(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  /* ---- derived ---- */
  const allItems: Item[] = useMemo(
    () => [
      ...pets.map((x) => ({ ...x, kind: "pet" as const })),
      ...products.map((x) => ({ ...x, kind: "product" as const })),
      ...services.map((x) => ({ ...x, kind: "service" as const })),
    ],
    [pets, products, services],
  );

  const filtered = useMemo(() => {
    if (catTab === "pets") return allItems.filter((i) => i.kind === "pet");
    if (catTab === "products")
      return allItems.filter((i) => i.kind === "product");
    if (catTab === "services")
      return allItems.filter((i) => i.kind === "service");
    return allItems;
  }, [allItems, catTab]);
  const visible = showAll ? filtered : filtered.slice(0, 6);

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  const name = business.name || business.business_name || "Vendor";
  const location = business.city_district || business.location_district;
  const hours = formatHours(business.working_hours || business.business_hours);

  /* ---- actions ---- */
  const handleCatTab = (next: CatTab) => {
    setCatTab(next);
    setShowAll(false);
  };

  const toggleCart = (item: Item) => {
    const key = itemKey(item);
    const has = cart.includes(key);
    const next = has ? cart.filter((k) => k !== key) : [...cart, key];
    setCart(next);
    writeKeys(CART_KEY, next);
    showToast(has ? "Removed from cart" : "Added to cart");
    // Endpoint paths are mocks notreal: adjust to match the backend
    if (has) callApi(`/cart/items/${item.kind}/${item.id}/`, "DELETE");
    else
      callApi("/cart/items/", "POST", {
        item_type: item.kind,
        item_id: item.id,
        quantity: 1,
      });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/vendors/${encodeURIComponent(String(business.id))}`;
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

  const closeModal = () => {
    setModal(null);
    setBookingItem(null);
  };

  const openBooking = (item: Item) => {
    setBookingItem(item);
    setModal("book");
  };

  const submitReport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    await callApi(`/businesses/${business.id}/report/`, "POST", {
      reason: form.get("reason"),
      details: form.get("details"),
    });
    setSubmitting(false);
    closeModal();
    showToast("Report sent. Thank you for keeping Pawdigree safe.");
  };

  const submitBooking = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bookingItem) return;
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    await callApi("/bookings/", "POST", {
      service: bookingItem.id,
      business: business.id,
      date: form.get("date"),
      time: form.get("time"),
      notes: form.get("notes"),
    });
    setSubmitting(false);
    closeModal();
    showToast("Booking request sent. The vendor will confirm shortly.");
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn] = useState(true);

  if (notFound) {
    return (
      <div className="cvp-shell">
        <SideMenu
          isOpen={isMenuOpen}
          setIsOpen={setIsMenuOpen}
          isLoggedIn={isLoggedIn}
          onClose={() => setIsMenuOpen(false)}
        />
        <div className="cvp-main">
          <TopNavbar
            isLoggedIn={isLoggedIn}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
          />
          <main className="cvp-page">
            <div className="cvp-card cvp-not-found">
              <h3>Vendor profile unavailable</h3>
              <p>
                Public vendor details are not available from the backend yet.
              </p>
              <button
                type="button"
                className="cvp-btn primary"
                onClick={() => navigate(-1)}
              >
                Go back
              </button>
            </div>
          </main>
        </div>
        <BottomNavbar />
      </div>
    );
  }

  // if page is found

  return (
    <div className="cvp-shell">
      <SideMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setIsMenuOpen(false)}
      />
      <div className="cvp-main">
        <TopNavbar
          isLoggedIn={isLoggedIn}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />

        <main className="cvp-page">
          {/* ---------- Banner ---------- */}
          <section className="cvp-banner-card">
            <div className="cvp-cover">
              <SafeImage
                src={business.cover_image}
                alt={`${name} cover`}
                kind="cover"
              />
            </div>

            <div className="cvp-profile-row">
              <div className="cvp-avatar">
                <SafeImage
                  src={business.logo}
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
                <button
                  type="button"
                  className="cvp-rating-link"
                  onClick={() =>
                    document
                      .getElementById("cvp-reviews")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Stars value={avgRating} size={14} />
                  <strong>{avgRating ? avgRating.toFixed(1) : "New"}</strong>
                  <span>
                    ({reviews.length} review{reviews.length === 1 ? "" : "s"})
                  </span>
                </button>
              </div>

              <div className="cvp-actions">
                <button
                  type="button"
                  className="cvp-btn primary"
                  onClick={() => navigate(`/messages?vendor=${business.id}`)}
                >
                  <MessageCircle size={16} /> Message
                </button>
                <button
                  type="button"
                  className="cvp-btn ghost"
                  onClick={handleShare}
                >
                  {copied ? <Check size={16} /> : <Share2 size={16} />}
                  {copied ? "Copied!" : "Share"}
                </button>
                <button
                  type="button"
                  className="cvp-btn danger"
                  onClick={() => setModal("report")}
                >
                  <Flag size={16} /> Report
                </button>
              </div>
            </div>
          </section>

          <div className="cvp-grid">
            {/* ---------- Left column ---------- */}
            <div className="cvp-left">
              <section className="cvp-card">
                <h4>About</h4>
                <p>{business.description}</p>
              </section>

              <section className="cvp-card">
                <h4>Store stats</h4>
                <div className="cvp-stats">
                  <div className="cvp-stat">
                    <strong>
                      {business.stats?.listings_count ??
                        business.listings_count ??
                        (allItems.length || 0)}
                    </strong>
                    <span>Listings</span>
                  </div>
                  <div className="cvp-stat">
                    <strong>
                      {business.stats?.orders_completed ??
                        business.orders_completed ??
                        business.total_orders ??
                        0}
                    </strong>
                    <span>Orders completed</span>
                  </div>
                  <div className="cvp-stat">
                    <strong>
                      {business.stats?.response_rate ??
                        business.response_rate ??
                        0}
                      %
                    </strong>
                    <span>Response rate</span>
                  </div>
                  <div className="cvp-stat">
                    <strong>
                      {business.created_at
                        ? new Date(business.created_at).getFullYear()
                        : (business.stats?.member_since ?? "-")}
                    </strong>
                    <span>Member since</span>
                  </div>
                </div>
              </section>

              <section className="cvp-card">
                <h4>Business information</h4>
                <div className="cvp-info">
                  <div>
                    <label>Category</label>
                    <p>{business.category_name || business.vendor_category}</p>
                  </div>
                  <div>
                    <label>Location</label>
                    <p>{location}</p>
                  </div>
                  <div>
                    <label>Address</label>
                    <p className="cvp-address">
                      <MapPin size={16} />
                      <span>{business.address}</span>
                    </p>
                  </div>
                </div>
              </section>

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
            </div>

            {/* ---------- Right column ---------- */}
            <div className="cvp-right">
              <section className="cvp-card">
                <h4>Available pets, products &amp; services</h4>
                <div className="cvp-tabs" role="tablist">
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
                      type="button"
                      role="tab"
                      aria-selected={catTab === key}
                      className={catTab === key ? "active" : ""}
                      onClick={() => handleCatTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {loadingListings ? (
                  <div className="cvp-listings">
                    <div className="cvp-skeleton" />
                    <div className="cvp-skeleton" />
                    <div className="cvp-skeleton" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="cvp-empty">
                    No {catTab === "all" ? "" : catTab} listings yet
                  </div>
                ) : (
                  <div className="cvp-listings">
                    {visible.map((item) => {
                      const key = itemKey(item);
                      const inCart = cart.includes(key);
                      return (
                        <article key={key} className="cvp-listing">
                          <div className="cvp-listing-img">
                            <SafeImage
                              src={item.image || item.cover_image || item.photo}
                              alt={itemName(item)}
                              kind={item.kind}
                            />
                            <span className={`cvp-kind ${item.kind}`}>
                              {item.kind === "pet"
                                ? "Pet"
                                : item.kind === "product"
                                  ? "Merch"
                                  : "Service"}
                            </span>
                          </div>
                          <div className="cvp-listing-info">
                            <h5 title={itemName(item)}>{itemName(item)}</h5>
                            <p className="cvp-price">{formatUGX(item.price)}</p>
                            {item.kind === "service" ? (
                              <button
                                type="button"
                                className="cvp-btn primary sm"
                                onClick={() => openBooking(item)}
                              >
                                <CalendarCheck size={14} /> Book service
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`cvp-btn sm ${inCart ? "in-cart" : "coral"}`}
                                onClick={() => toggleCart(item)}
                                aria-pressed={inCart}
                              >
                                {inCart ? (
                                  <Check size={14} />
                                ) : (
                                  <ShoppingCart size={14} />
                                )}
                                {inCart ? "In cart" : "Add to cart"}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {filtered.length > 6 && (
                  <button
                    type="button"
                    className="cvp-btn coral block"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll
                      ? "Show less"
                      : `View all ${catTab === "all" ? "listings" : catTab} (${filtered.length})`}
                  </button>
                )}
              </section>

              {/* ---------- Reviews ---------- */}
              <section className="cvp-card" id="cvp-reviews">
                <div className="cvp-reviews-head">
                  <h4>Ratings &amp; reviews</h4>
                  <span className="cvp-form-note">Reviews are unavailable until review data is supported.</span>
                </div>

                <div className="cvp-summary">
                  <div className="cvp-score">
                    <strong>{avgRating ? avgRating.toFixed(1) : "-"}</strong>
                    <Stars value={avgRating} />
                    <span>
                      {reviews.length} review{reviews.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="cvp-bars">
                    {distribution.map((d) => (
                      <div key={d.n} className="cvp-bar-row">
                        <span>{d.n}</span>
                        <div className="cvp-bar">
                          <div
                            style={{
                              width: reviews.length
                                ? `${(d.count / reviews.length) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                        <span className="count">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="cvp-empty">
                    Reviews will appear here when a review API is available.
                  </div>
                ) : (
                  <ul className="cvp-review-list">
                    {reviews.map((r) => (
                      <li key={r.id}>
                        <div className="cvp-review-top">
                          <span className="cvp-reviewer">
                            <span className="cvp-reviewer-av">
                              {r.author.charAt(0).toUpperCase()}
                            </span>
                            {r.author}
                          </span>
                          <span className="cvp-review-date">
                            {formatDate(r.date)}
                          </span>
                        </div>
                        <Stars value={r.rating} size={14} />
                        {r.comment && <p>{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>

      <BottomNavbar />

      {toast && (
        <div className="cvp-toast" role="status">
          {toast}
        </div>
      )}

      {/* ---------- Modals ---------- */}
      {modal === "report" && (
        <Modal title={`Report ${name}`} onClose={closeModal}>
          <form onSubmit={submitReport} className="cvp-form">
            <label htmlFor="cvp-reason">Reason</label>
            <select id="cvp-reason" name="reason" required defaultValue="">
              <option value="" disabled>
                Select a reason
              </option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label htmlFor="cvp-details">Details</label>
            <textarea
              id="cvp-details"
              name="details"
              rows={4}
              placeholder="Tell us what happened"
              required
            />
            <div className="cvp-form-actions">
              <button
                type="button"
                className="cvp-btn ghost"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cvp-btn danger solid"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Submit report"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "book" && bookingItem && (
        <Modal title={`Book: ${itemName(bookingItem)}`} onClose={closeModal}>
          <form onSubmit={submitBooking} className="cvp-form">
            <p className="cvp-form-note">
              {formatUGX(bookingItem.price)} at {name}
            </p>
            <label htmlFor="cvp-date">Date</label>
            <input
              id="cvp-date"
              name="date"
              type="date"
              min={todayStr}
              required
            />
            <label htmlFor="cvp-time">Preferred time</label>
            <input id="cvp-time" name="time" type="time" required />
            <label htmlFor="cvp-notes">Notes (optional)</label>
            <textarea
              id="cvp-notes"
              name="notes"
              rows={3}
              placeholder="Pet name, breed, anything the vendor should know"
            />
            <div className="cvp-form-actions">
              <button
                type="button"
                className="cvp-btn ghost"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cvp-btn primary"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Request booking"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

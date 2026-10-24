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
  Heart,
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
/* Mock data (UI preview only; real data replaces it when the API      */
/* responds). Images are Unsplash links for preview only; if a link     */
/* fails, the on-brand illustrated placeholder shows instead.          */
/* ------------------------------------------------------------------ */

const MOCK_BUSINESS: Business = {
  id: 1,
  business_name: "Pawdigree Vet Clinic",
  name: "Pawdigree Vet Clinic",
  description:
    "We provide quality veterinary services, including checkups, vaccinations, and pet wellness care. Trusted since 2024. We are committed to keeping your furry friends healthy and happy.",
  category_name: "Vet Clinic",
  vendor_category: "Vet Clinic",
  city_district: "Kampala",
  location_district: "Kampala",
  address: "Plot 12, Lumumba Avenue, Kampala, Uganda",
  contact: "+256 700 123456",
  phone: "+256 700 123456",
  email: "info@pawdigree.vet",
  business_hours: {
    monday: { is_open: true, open: "09:00", close: "18:00" },
    tuesday: { is_open: true, open: "09:00", close: "18:00" },
    wednesday: { is_open: true, open: "09:00", close: "18:00" },
    thursday: { is_open: true, open: "09:00", close: "18:00" },
    friday: { is_open: true, open: "09:00", close: "18:00" },
    saturday: { is_open: true, open: "09:00", close: "14:00" },
    sunday: { is_open: false, open: "09:00", close: "17:00" },
  },
  created_at: "2024-01-15",
  cover_image:
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80&auto=format&fit=crop",
  logo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&q=80&auto=format&fit=crop",
  stats: { listings_count: 69, orders_completed: 412, response_rate: 96 },
};

const MOCK_PETS: Listing[] = [
  {
    id: 101,
    name: "German Shepherd Puppy",
    price: 800000,
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 102,
    name: "Persian Cat",
    price: 500000,
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 103,
    name: "Labrador Retriever",
    price: 750000,
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 104,
    name: "Bulldog",
    price: 650000,
    image:
      "https://images.unsplash.com/photo-1583512603807-63cc1dc8889b?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 105,
    name: "Beagle Puppy",
    price: 600000,
    image:
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 106,
    name: "Golden Retriever",
    price: 900000,
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 107,
    name: "Siamese Kitten",
    price: 450000,
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&q=80&auto=format&fit=crop",
  },
];

const MOCK_PRODUCTS: Listing[] = [
  {
    id: 201,
    name: "Dog Food - 10kg",
    price: 120000,
    image:
      "https://images.unsplash.com/photo-1589924691995-c10e5725a7d0?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 202,
    name: "Cat Litter Box",
    price: 80000,
    image:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 203,
    name: "Pet Shampoo",
    price: 35000,
    image:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80&auto=format&fit=crop",
  },
];

const MOCK_SERVICES: Listing[] = [
  {
    id: 301,
    name: "Vaccination Service",
    price: 50000,
    image:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&q=80&auto=format&fit=crop",
  },
  {
    id: 302,
    name: "Grooming Full Package",
    price: 70000,
    image:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80&auto=format&fit=crop",
  },
];

const MOCK_REVIEWS: Review[] = [
  {
    id: "m1",
    author: "Grace N.",
    rating: 5,
    comment:
      "Very caring staff. My puppy's vaccination was quick and stress free.",
    date: "2026-09-18",
  },
  {
    id: "m2",
    author: "David K.",
    rating: 4,
    comment: "Good service and fair prices. Waiting time was a bit long.",
    date: "2026-08-30",
  },
  {
    id: "m3",
    author: "Aisha M.",
    rating: 5,
    comment:
      "Bought my Persian cat here. Healthy, and the papers were in order.",
    date: "2026-08-02",
  },
];

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

// there are no
// pets/products/services/reviews endpoints, these keep sample cards and
// reviews on screen. Set each to false once its endpoint ships.
const MOCK_LISTINGS_FALLBACK = true;
const MOCK_REVIEWS_FALLBACK = true;

const FAV_KEY = "pawdigree_favorites";
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

function normalizeReview(raw: unknown, index: number): Review {
  const r = (raw ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "string" && v) return v;
    }
    return "";
  };
  return {
    id: (r.id as number | string | undefined) ?? `r${index}`,
    author:
      pick("author", "user_name", "reviewer", "customer_name") || "Customer",
    rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
    comment: pick("comment", "text", "review", "body"),
    date: pick("created_at", "date"),
  };
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

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="cvp-star-input" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star
            size={30}
            className={n <= (hover || value) ? "cvp-star on" : "cvp-star"}
          />
        </button>
      ))}
    </div>
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

  const [business, setBusiness] = useState<Business>(MOCK_BUSINESS);
  const [verified, setVerified] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pets, setPets] = useState<Listing[]>([]);
  const [products, setProducts] = useState<Listing[]>([]);
  const [services, setServices] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);

  const [catTab, setCatTab] = useState<CatTab>("all");
  const [showAll, setShowAll] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readKeys(FAV_KEY));
  const [cart, setCart] = useState<string[]>(() => readKeys(CART_KEY));

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<"report" | "review" | "book" | null>(null);
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
        if (res.status === 404 && !cancelled) setNotFound(true);
        if (res.ok) {
          const data = (await res.json()) as Business;
          if (!cancelled && data?.id) {
            setBusiness(data);
            const raw = data as unknown as Record<string, unknown>;
            setVerified(
              raw.is_verified === true ||
                raw.verification_status === "verified",
            );
          }
        }
      } catch {
        // Backend unreachable or timed out: keep showing the mock data
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
      const [p, pr, s, rv] = await Promise.all([
        fetchList<Listing>(`${API_BASE_URL}/pets/?business=${vendorId}`),
        fetchList<Listing>(`${API_BASE_URL}/products/?business=${vendorId}`),
        fetchList<Listing>(`${API_BASE_URL}/services/?business=${vendorId}`),
        fetchList<unknown>(`${API_BASE_URL}/businesses/${vendorId}/reviews/`),
      ]);
      if (cancelled) return;
      setPets(p && p.length ? p : MOCK_LISTINGS_FALLBACK ? MOCK_PETS : []);
      setProducts(
        pr && pr.length ? pr : MOCK_LISTINGS_FALLBACK ? MOCK_PRODUCTS : [],
      );
      setServices(
        s && s.length ? s : MOCK_LISTINGS_FALLBACK ? MOCK_SERVICES : [],
      );
      if (rv && rv.length) setReviews(rv.map(normalizeReview));
      else if (!MOCK_REVIEWS_FALLBACK) setReviews([]);
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

  const toggleFavorite = (item: Item) => {
    const key = itemKey(item);
    const has = favorites.includes(key);
    const next = has ? favorites.filter((k) => k !== key) : [...favorites, key];
    setFavorites(next);
    writeKeys(FAV_KEY, next);
    showToast(has ? "Removed from favorites" : "Added to favorites");
    // Endpoint paths are assumptions: adjust to match the backend
    if (has) callApi(`/favorites/${item.kind}/${item.id}/`, "DELETE");
    else
      callApi("/favorites/", "POST", {
        item_type: item.kind,
        item_id: item.id,
      });
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
    const url = `${window.location.origin}/business/${business.id}`;
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

  const submitReview = async (rating: number, comment: string) => {
    setSubmitting(true);
    await callApi(`/businesses/${business.id}/reviews/`, "POST", {
      rating,
      comment,
    });
    // Shown locally right away so the UI works before the backend is wired up
    setReviews((prev) => [
      {
        id: `local-${Date.now()}`,
        author: "You",
        rating,
        comment,
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
    setSubmitting(false);
    closeModal();
    showToast("Thanks for your review!");
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
              <h3>Vendor not found</h3>
              <p>
                This vendor profile doesn't exist or is no longer available.
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
                      const isFav = favorites.includes(key);
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
                            <button
                              type="button"
                              className={`cvp-fav ${isFav ? "on" : ""}`}
                              onClick={() => toggleFavorite(item)}
                              aria-pressed={isFav}
                              aria-label={
                                isFav
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                            >
                              <Heart size={16} />
                            </button>
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
                  <button
                    type="button"
                    className="cvp-btn primary sm"
                    onClick={() => setModal("review")}
                  >
                    <Star size={14} /> Rate this vendor
                  </button>
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
                    No reviews yet. Be the first to review!
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

      {modal === "review" && (
        <ReviewForm
          name={name}
          submitting={submitting}
          onCancel={closeModal}
          onSubmit={submitReview}
        />
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

function ReviewForm({
  name,
  submitting,
  onCancel,
  onSubmit,
}: {
  name: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <Modal title={`Rate ${name}`} onClose={onCancel}>
      <form
        className="cvp-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (rating > 0) onSubmit(rating, comment.trim());
        }}
      >
        <label>Your rating</label>
        <StarInput value={rating} onChange={setRating} />
        <label htmlFor="cvp-comment">Your review</label>
        <textarea
          id="cvp-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this vendor"
        />
        <div className="cvp-form-actions">
          <button type="button" className="cvp-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="cvp-btn primary"
            disabled={rating === 0 || submitting}
          >
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

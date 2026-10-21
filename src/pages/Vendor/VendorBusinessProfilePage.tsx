import { useEffect, useState, useRef } from "react";
import {
  Phone,
  Mail,
  Clock,
  BadgeCheck,
  Share2,
  Camera,
  Pencil,
} from "lucide-react";
import VendorSidebar from "../../components/vendor/VendorSidebar/VendorSidebar";
import VendorTopbar from "../../components/vendor/VendorTopbar/VendorTopbar";
import VendorPageHeader from "../../components/vendor/VendorPageHeader/VendorPageHeader";
import VendorBusinessUpdateForm from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";
import API_BASE_URL from "../../services/api";
import "./VendorBusinessProfilePage.css";

export default function VendorBusinessProfilePage() {
  const [tab, setTab] = useState<"view" | "edit">("view");
  const [catTab, setCatTab] = useState<
    "all" | "pets" | "products" | "services"
  >("all");
  const [business, setBusiness] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // MOCK BUSINESS - FOR UI PREVIEW ONLY to show fields and UI instantly
  // When using real, Comment/ delete out this whole function
  const MOCK_BUSINESS = {
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
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200",
    logo: "",
    stats: { listings_count: 69, orders_completed: 412, response_rate: 96 },
  };

  // (LoadData function) ACTIVE NOW: MOCK version to show UI instantly
  // To use real, Comment out/ delete this whole function and uncomment the one below it
  const loadData = async () => {
    // ADDED FOR PERSISTENT SAVE: load custom images
    const savedCover = localStorage.getItem("pawdigree_cover_image");
    const savedLogo = localStorage.getItem("pawdigree_logo");
    const businessWithSaved = {
      ...MOCK_BUSINESS,
      ...(savedCover ? { cover_image: savedCover } : {}),
      ...(savedLogo ? { logo: savedLogo } : {}),
    };
    setBusiness(businessWithSaved);
    setVerification({ status: "verified", last_verified: "2024-12-01" });
    setLoading(false);
    const token =
      localStorage.getItem("access") || localStorage.getItem("access_token");
    if (!token) return;
    const headers: any = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    const withTimeout = (p: Promise<any>, ms = 3500) =>
      Promise.race([
        p,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), ms),
        ),
      ]);
    try {
      const listRes: any = await withTimeout(
        fetch(`${API_BASE_URL}/businesses/`, { headers }),
        4000,
      );
      if (listRes?.ok) {
        const data = await listRes.json();
        const first = Array.isArray(data) ? data[0] : data.results?.[0] || data;
        if (first?.id && first.id !== 1) {
          setBusiness({
            ...first,
            cover_image: savedCover || first.cover_image,
            logo: savedLogo || first.logo,
          });
        }
      }
      const vRes: any = await withTimeout(
        fetch(`${API_BASE_URL}/businesses/verification-status/`, { headers }),
        3000,
      ).catch(() => null);
      if (vRes?.ok) setVerification(await vRes.json());
    } catch {}
  };

  // REAL PRODUCTION VERSION FOR loadData - COMMENTED
  /*
  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("access") || localStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    const headers: any = { Accept: "application/json", Authorization: `Bearer ${token}` };
    try {
      const res = await fetch(`${API_BASE_URL}/businesses/`, { headers });
      if (!res.ok) throw new Error("Failed to fetch businesses");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || [];
      const first = list[0] || null;
      if (!first) { setBusiness(null); setVerification(null); return; }
      setBusiness(first);
      try {
        const vRes = await fetch(`${API_BASE_URL}/businesses/verification-status/`, { headers });
        if (vRes.ok) { const vData = await vRes.json(); setVerification(vData); } else { setVerification(null); }
      } catch { setVerification(null); }
    } catch (e) {
      console.error("Business profile load error:", e);
      setBusiness(null); setVerification(null);
    } finally { setLoading(false); }
  };
  */

  useEffect(() => {
    loadData();
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
          {loading ? (
            <p className="bp-loading">Loading...</p>
          ) : tab === "view" ? (
            <VendorProfileView
              business={business}
              verification={verification}
              catTab={catTab}
              setCatTab={setCatTab}
              onEdit={() => setTab("edit")}
              onBusinessUpdate={(updates: any) =>
                setBusiness((prev: any) => ({ ...prev, ...updates }))
              }
            />
          ) : (
            <VendorBusinessUpdateForm
              business={business}
              onSaved={(b) => {
                setBusiness(b);
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

function VendorProfileView({
  business,
  verification,
  catTab,
  setCatTab,
  onEdit,
  onBusinessUpdate,
}: any) {
  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };
  const cap = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending";

  const formatHours = (hours: any) => {
    if (!hours) return [];
    try {
      // Case: object like { Monday: {open, close} } or { Monday: "09:00-18:00" }
      if (typeof hours === "object" && !Array.isArray(hours)) {
        return Object.entries(hours).map(([day, val]: [string, any]) => {
          let timeStr = "";
          if (!val) timeStr = "Closed";
          else if (typeof val === "string") timeStr = val;
          else if (typeof val === "object") {
            if (val.is_closed || val.closed || val.isClosed) timeStr = "Closed";
            else if (val.open && val.close)
              timeStr = `${val.open} - ${val.close}`;
            else if (val.start && val.end)
              timeStr = `${val.start} - ${val.end}`;
            else if (val.from && val.to) timeStr = `${val.from} - ${val.to}`;
            else if (val.time) timeStr = String(val.time);
            else timeStr = Object.values(val).join(" - ");
          }
          return { day, time: timeStr };
        });
      }
      // Case: string like "monday:09:00-18:00, tuesday:..."
      if (typeof hours === "string" && hours.includes(":")) {
        return hours
          .split(",")
          .map((s) => {
            const parts = s.trim().split(":");
            const day = parts[0] || "";
            const time = parts.slice(1).join(":").trim();
            return { day: day.trim(), time };
          })
          .filter((h) => h.day);
      }
    } catch (e) {
      console.log("hours parse error", e);
    }
    return [];
  };

  const capDay = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  const [copied, setCopied] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_COVER =
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200";
  const DEFAULT_AVATAR = `https://ui-avatars.com/api/?name=${encodeURIComponent(business?.name || business?.business_name || "Business")}&background=E7F1F0&color=216C68`;

  const MOCK_PETS = [
    {
      id: 101,
      name: "German Shepherd Puppy",
      price: 800000,
      image:
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    },
    {
      id: 102,
      name: "Persian Cat",
      price: 500000,
      image:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
    },
    {
      id: 103,
      name: "Labrador Retriever",
      price: 750000,
      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
    },
    {
      id: 104,
      name: "Bulldog",
      price: 650000,
      image:
        "https://images.unsplash.com/photo-1583512603807-63cc1dc8889b?w=400",
    },
    {
      id: 105,
      name: "Beagle Puppy",
      price: 600000,
      image:
        "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400",
    },
    {
      id: 106,
      name: "Golden Retriever",
      price: 900000,
      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
    },
    {
      id: 107,
      name: "Siamese Kitten",
      price: 450000,
      image:
        "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400",
    },
  ];
  const MOCK_PRODUCTS = [
    {
      id: 201,
      name: "Dog Food - 10kg",
      price: 120000,
      image:
        "https://images.unsplash.com/photo-1589924691995-c10e5725a7d0?w=400",
    },
    {
      id: 202,
      name: "Cat Litter Box",
      price: 80000,
      image:
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    },
    {
      id: 203,
      name: "Pet Shampoo",
      price: 35000,
      image:
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
    },
  ];
  const MOCK_SERVICES = [
    {
      id: 301,
      name: "Vaccination Service",
      price: 50000,
      image:
        "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400",
    },
    {
      id: 302,
      name: "Grooming Full Package",
      price: 70000,
      image:
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    },
  ];

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/business/${business.id}`;
    const shareData = {
      title: business.name || business.business_name,
      text: `Check out ${business.name || business.business_name} on Pawdigree`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  // Convert file to base64 for persistent storage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
    });
  };

  const uploadImage = async (file: File, field: "cover_image" | "logo") => {
    try {
      if (field === "cover_image") setUploadingCover(true);
      else setUploadingLogo(true);

      // 1. Convert to base64 so it survives refresh
      const base64 = await fileToBase64(file);

      // 2. Save to localStorage immediately - persists
      localStorage.setItem(`pawdigree_${field}`, base64);

      // 3. Update parent business state - updates UI instantly and stays
      onBusinessUpdate({ [field]: base64 });

      // 4. Try backend upload (when ready, it will use real URL)
      const token =
        localStorage.getItem("access") || localStorage.getItem("access_token");
      if (token) {
        const formData = new FormData();
        formData.append(field, file);
        const endpoints = [
          `${API_BASE_URL}/businesses/${business.id}/`,
          `${API_BASE_URL}/businesses/${business.id}/update/`,
          `${API_BASE_URL}/businesses/update/`,
          `${API_BASE_URL}/businesses/me/`,
        ];
        for (const url of endpoints) {
          try {
            const res = await fetch(url, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });
            if (res.ok) {
              const updated = await res.json().catch(() => null);
              if (updated) {
                if (updated.cover_image) {
                  localStorage.setItem(
                    "pawdigree_cover_image",
                    updated.cover_image,
                  );
                  onBusinessUpdate({ cover_image: updated.cover_image });
                }
                if (updated.logo) {
                  localStorage.setItem("pawdigree_logo", updated.logo);
                  onBusinessUpdate({ logo: updated.logo });
                }
              }
              break;
            }
          } catch {}
        }
      }
    } finally {
      if (field === "cover_image") setUploadingCover(false);
      else setUploadingLogo(false);
    }
  };

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage(file, "cover_image");
    e.target.value = ""; // allow same file to be selected again
  };

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage(file, "logo");
    e.target.value = "";
  };

  useEffect(() => {
    setShowAll(false);
  }, [catTab]);

  useEffect(() => {
    if (!business?.id) return;
    const token =
      localStorage.getItem("access") || localStorage.getItem("access_token");
    const headers: any = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const fetchList = async (url: string) => {
      try {
        const r = await fetch(url, { headers });
        if (!r.ok) return null;
        const d = await r.json();
        return Array.isArray(d) ? d : d.results || [];
      } catch {
        return null;
      }
    };
    const loadListings = async () => {
      setLoadingListings(true);
      const [petsData, productsData, servicesData] = await Promise.all([
        fetchList(`${API_BASE_URL}/pets/?business=${business.id}`),
        fetchList(`${API_BASE_URL}/products/?business=${business.id}`),
        fetchList(`${API_BASE_URL}/services/?business=${business.id}`),
      ]);
      setPets(petsData && petsData.length ? petsData : MOCK_PETS);
      setProducts(
        productsData && productsData.length ? productsData : MOCK_PRODUCTS,
      );
      setServices(
        servicesData && servicesData.length ? servicesData : MOCK_SERVICES,
      );
      setLoadingListings(false);
    };
    loadListings();
  }, [business?.id]);

  const allCombined = [...pets, ...products, ...services];
  const getFiltered = () => {
    if (catTab === "all") return allCombined;
    if (catTab === "pets") return pets;
    if (catTab === "products") return products;
    if (catTab === "services") return services;
    return [];
  };
  const filtered = getFiltered();
  const visible = showAll ? filtered : filtered.slice(0, 6);

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

  return (
    <div className="bp-content">
      <div className="bp-banner-card">
        <div
          className="bp-cover"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <img
            src={business.cover_image || DEFAULT_COVER}
            alt="cover"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onCoverChange}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onLogoChange}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="bp-cover-edit-btn"
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-card, #ffffff)",
              color: "var(--primary, #216C68)",
              border: "1px solid var(--border, #E7F1F0)",
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <Camera size={14} />{" "}
            {uploadingCover ? "Uploading..." : "Change Cover"}
          </button>
        </div>
        <div className="bp-profile-row">
          <div className="bp-left-group">
            <div
              style={{
                position: "relative",
                width: 80,
                height: 80,
                flexShrink: 0,
              }}
            >
              <img
                className="bp-avatar-circle"
                src={business.logo || DEFAULT_AVATAR}
                alt="logo"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid white",
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="bp-avatar-edit-btn"
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  zIndex: 10,
                  background: "var(--primary, #216C68)",
                  color: "white",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid white",
                  cursor: "pointer",
                }}
              >
                {uploadingLogo ? (
                  <span style={{ fontSize: 10 }}>...</span>
                ) : (
                  <Pencil size={12} />
                )}
              </button>
            </div>

            <div className="bp-title" style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  textWrap: "nowrap",
                }}
              >
                {business.name || business.business_name}
              </h2>
              <p
                style={{
                  margin: 0,
                  alignItems: "center",
                  fontSize: 12.5,
                  opacity: 0.65,
                }}
              >
                {business.city_district || business.location_district} •{" "}
                {business.category_name || "Vendor"}
              </p>
              {verification?.status === "verified" ? (
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
          <section className="bp-card">
            <h4>ABOUT</h4>
            <p>{business.description}</p>
          </section>
          <section className="bp-card store-stats-card">
            <h4>STORE STATS</h4>
            <div className="stats-grid">
              <div className="stat-box">
                <strong className="stat-number">
                  {business?.stats?.listings_count ??
                    business?.listings_count ??
                    (allCombined.length || 69)}
                </strong>
                <span className="stat-label">Listings</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">
                  {business?.stats?.orders_completed ??
                    business?.orders_completed ??
                    business?.total_orders ??
                    412}
                </strong>
                <span className="stat-label">Orders completed</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">
                  {business?.stats?.response_rate ??
                    business?.response_rate ??
                    96}
                  %
                </strong>
                <span className="stat-label">Response rate</span>
              </div>
              <div className="stat-box">
                <strong className="stat-number">
                  {business?.created_at
                    ? new Date(business.created_at).getFullYear()
                    : (business?.stats?.member_since ?? 2024)}
                </strong>
                <span className="stat-label">Member since</span>
              </div>
            </div>
          </section>
          <section className="bp-card">
            <h4>Business Information</h4>
            <div className="info-list">
              <div>
                <label>Category</label>
                <p>{business.category_name || business.vendor_category}</p>
              </div>
              <div>
                <label>Location</label>
                <p>{business.city_district || business.location_district}</p>
              </div>
              <div>
                <label>Address</label>
                <p>{business.address}</p>
              </div>
              <div>
                <label>Verification</label>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className={
                      verification?.status === "verified"
                        ? "verified-badge"
                        : "pending-badge"
                    }
                    style={{ marginTop: 0 }}
                  >
                    <BadgeCheck size={14} />{" "}
                    {cap(verification?.status || "pending")}
                  </span>
                  {verification?.last_verified && (
                    <span
                      style={{
                        fontSize: "14px",
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
          <section className="bp-card">
            <h4>Contact & Business Hours</h4>
            <div className="bp-contact-list">
              {business.phone && (
                <div className="bp-contact-row">
                  <Phone size={20} className="bp-contact-icon" />
                  <a href={`tel:${business.phone}`} className="bp-contact-link">
                    {business.phone}
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
              {(business.working_hours || business.business_hours) && (
                <div className="bp-contact-row bp-hours-row">
                  <Clock size={20} className="bp-contact-icon" />
                  <div className="bp-hours-grid">
                    {formatHours(
                      business.working_hours || business.business_hours,
                    ).map((h: any, i: number) => (
                      <div key={i} className="bp-hour-item">
                        <span className="bp-hour-day">{capDay(h.day)}</span>
                        <span className="bp-hour-time">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="bp-right">
          <section className="bp-card">
            <h4>Available Pets and Products</h4>
            <div className="category-switcher">
              <button
                className={catTab === "all" ? "active" : ""}
                onClick={() => setCatTab("all")}
              >
                All
              </button>
              <button
                className={catTab === "pets" ? "active" : ""}
                onClick={() => setCatTab("pets")}
              >
                Pets
              </button>
              <button
                className={catTab === "products" ? "active" : ""}
                onClick={() => setCatTab("products")}
              >
                Merchandise
              </button>
              <button
                className={catTab === "services" ? "active" : ""}
                onClick={() => setCatTab("services")}
              >
                Services
              </button>
            </div>
            {loadingListings ? (
              <div className="listings-grid">
                <div className="listing-skeleton" />
                <div className="listing-skeleton" />
                <div className="listing-skeleton" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="listings-placeholder">
                No {catTab} listings yet
              </div>
            ) : (
              <div className="listings-grid">
                {visible.map((item: any) => (
                  <div key={item.id} className="listing-card">
                    <div className="listing-img">
                      <img
                        src={
                          item.image ||
                          item.cover_image ||
                          item.photo ||
                          "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"
                        }
                        alt={item.name || item.title}
                      />
                    </div>
                    <div className="listing-info">
                      <h5>{item.name || item.title}</h5>
                      <p className="listing-price">
                        UGX {(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filtered.length > 6 && (
              <button
                className="secondary-btn"
                onClick={() => setShowAll(!showAll)}
                style={{ width: "100%", marginTop: 12 }}
              >
                {showAll
                  ? "Show Less"
                  : `View all ${catTab === "all" ? "listings" : catTab} (${filtered.length})`}
              </button>
            )}
            {filtered.length > 0 && filtered.length <= 6 && (
              <button
                className="secondary-btn"
                onClick={() => setShowAll(true)}
                style={{ width: "100%", marginTop: 12 }}
              >
                View all {catTab === "all" ? "listings" : catTab}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

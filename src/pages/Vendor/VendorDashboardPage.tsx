import { useEffect, useState } from "react";
import { CalendarCheck, DollarSign, MessageCircle, ShoppingCart, Star, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { apiRequest } from "../../services/api";
import { useVendorBusinesses, useVendorBusiness } from "../../services/vendorBusinessStore";
import VendorDashboardTour from "../../components/vendor/VendorDashboardTour/VendorDashboardTour";
import { VendorBusinessList } from "../../components/vendor/VendorBusinessSwitcher/VendorBusinessSwitcher";
import {
  fetchVendorDashboardBookings,
  fetchVendorDashboardOrders,
  fetchVendorDashboardPetSales,
  type VendorBookingActivity,
  type VendorSale,
} from "../../services/vendorDashboardApi";
import "./VendorDashboardPage.css";

type MetricState = "loading" | "loaded" | "error";
const metrics = [
  { icon: DollarSign, label: "Total Sales", value: "Unavailable", note: "Current APIs do not expose a complete vendor sales total.", key: "sales" },
  { icon: ShoppingCart, label: "Orders", value: "—", note: "Paid merchandise orders plus paid pet sales; unpaid reservations are excluded.", key: "orders" },
  { icon: Wallet, label: "Revenue (Net)", value: "Unavailable", note: "Net revenue cannot be calculated from current API data.", key: "revenue" },
  { icon: CalendarCheck, label: "Pending Bookings", value: "—", note: "Bookings awaiting a vendor decision.", key: "bookings" },
];

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function readableStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function VendorDashboardPage() {
  const activeBusiness = useVendorBusiness();
  const { businesses, loading: businessesLoading, error: businessesError } = useVendorBusinesses();
  const [firstName, setFirstName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [orders, setOrders] = useState<VendorSale[]>([]);
  const [bookings, setBookings] = useState<VendorBookingActivity[]>([]);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [pendingBookingCount, setPendingBookingCount] = useState<number | null>(null);
  const [ordersState, setOrdersState] = useState<MetricState>("loading");
  const [bookingsState, setBookingsState] = useState<MetricState>("loading");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");

  useEffect(() => {
    if (!token || role !== "VENDOR") return;
    let cancelled = false;
    void apiRequest<{ first_name?: string; id?: string | number }>("/auth/current-user/", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((user) => {
      if (!cancelled) {
        setFirstName(user.first_name?.trim() ?? "");
        setVendorId(user.id === undefined ? "" : String(user.id));
      }
    }).catch(() => { if (!cancelled) setFirstName(""); });
    return () => { cancelled = true; };
  }, [token, role]);

  useEffect(() => {
    if (!token || role !== "VENDOR") return;
    let cancelled = false;
    void Promise.all([fetchVendorDashboardOrders(), fetchVendorDashboardPetSales(), fetchVendorDashboardPetSales("PAID")])
      .then(([productOrders, petSales, paidPetSales]) => {
        if (!cancelled) {
          setOrders([...productOrders.results, ...petSales.results].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5));
          // Orders counts vendor-order records: paid merchandise rows plus paid pet-sale rows.
          // The two backend queries are item-type exclusive; RESERVED pet holds are excluded.
          setOrderCount(productOrders.count + paidPetSales.count);
          setOrdersState("loaded");
        }
      })
      .catch(() => { if (!cancelled) setOrdersState("error"); });
    void Promise.all([fetchVendorDashboardBookings(), fetchVendorDashboardBookings("pending")])
      .then(([recent, pending]) => {
        if (!cancelled) {
          setBookings(recent.results);
          setPendingBookingCount(pending.count);
          setBookingsState("loaded");
        }
      })
      .catch(() => { if (!cancelled) setBookingsState("error"); });
    return () => { cancelled = true; };
  }, [token, role]);

  if (!token || role !== "VENDOR") return null;

  return (
    <VendorLayout
      title={`Welcome back, ${firstName || "there"}`}
      description="Here's how your businesses are doing today"
      businessName={activeBusiness?.name ?? "Your businesses"}
      vendorWorkspace
      mainVendorDashboard
    >
      <div className="dashboard-content">
        <VendorBusinessList businesses={businesses} loading={businessesLoading} error={businessesError} />

        <section className="dashboard-metrics" aria-label="Vendor-wide summary" data-vendor-tour="overview">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const state = metric.key === "orders" ? ordersState : metric.key === "bookings" ? bookingsState : "loaded";
            const value = metric.key === "orders"
              ? state === "loading" ? "…" : state === "error" ? "Unavailable" : orderCount ?? 0
              : metric.key === "bookings"
                ? state === "loading" ? "…" : state === "error" ? "Unavailable" : pendingBookingCount ?? 0
                : metric.value;
            return <article className="dashboard-metric-card" key={metric.label}>
              <span className={`dashboard-metric-icon ${metric.key}`} aria-hidden="true"><Icon size={18} strokeWidth={1.9} /></span>
              <strong>{value}</strong>
              <div className="dashboard-metric-bottom"><span>{metric.label}</span></div>
              <p className="dashboard-metric-note">{metric.key === "orders" && state === "error" || metric.key === "bookings" && state === "error" ? "Could not load this figure." : metric.note}</p>
            </article>;
          })}
        </section>

        <section className="dashboard-panel dashboard-orders-panel" aria-labelledby="recent-orders-title" data-vendor-tour="recent-orders">
          <div className="dashboard-activity-heading"><h2 id="recent-orders-title">RECENT ORDERS</h2><Link to="/vendor/orders">View all</Link></div>
          {ordersState === "loading" ? <p className="dashboard-activity-state" role="status">Loading recent orders…</p>
            : ordersState === "error" ? <p className="dashboard-activity-state" role="alert">Orders could not be loaded. Please try again later.</p>
              : orders.length === 0 ? <p className="dashboard-activity-state">No recent orders or pet sales.</p>
                : <div className="dashboard-table-wrapper"><table className="dashboard-orders-table"><thead><tr><th>REFERENCE</th><th>CUSTOMER</th><th>BUSINESS</th><th>DATE</th><th>STATUS</th></tr></thead>
                  <tbody>{orders.map((item) => <tr key={`order-${item.id}`}><td>#{item.order_id}</td><td>{item.customer?.name || "Customer"}</td><td>{item.business_name}</td><td>{dateLabel(item.created_at)}</td><td>{readableStatus(item.sale_state === "RESERVED" ? "RESERVED" : item.status)}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="dashboard-panel dashboard-orders-panel" aria-labelledby="recent-bookings-title" data-vendor-tour="recent-bookings">
          <div className="dashboard-activity-heading"><h2 id="recent-bookings-title">RECENT BOOKINGS</h2><Link to="/vendor/orders">View all</Link></div>
          {bookingsState === "loading" ? <p className="dashboard-activity-state" role="status">Loading recent bookings…</p>
            : bookingsState === "error" ? <p className="dashboard-activity-state" role="alert">Bookings could not be loaded. Please try again later.</p>
              : bookings.length === 0 ? <p className="dashboard-activity-state">No recent bookings.</p>
                : <div className="dashboard-table-wrapper"><table className="dashboard-orders-table"><thead><tr><th>CUSTOMER</th><th>BUSINESS</th><th>SERVICE</th><th>BOOKING TIME</th><th>STATUS</th></tr></thead>
                  <tbody>{bookings.map((item) => <tr key={`booking-${item.booking_id}`}><td>{item.customer?.name || "Customer"}</td><td>{item.business_name}</td><td>{item.service_name}</td><td>{dateLabel(item.start_at)}</td><td>{readableStatus(item.status)}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="dashboard-panel dashboard-capability-panel" aria-labelledby="recent-messages-title" data-vendor-tour="messages">
          <div className="dashboard-activity-heading"><h2 id="recent-messages-title"><MessageCircle size={17} /> RECENT CUSTOMER MESSAGES</h2><Link to="/vendor/messages">View all</Link></div>
          <p className="dashboard-activity-state">General customer conversations are not available in the current services. Adoption information exchanges remain available in the <Link to="/vendor/adoption-applications">adoption applications workflow</Link>.</p>
        </section>

        <section className="dashboard-panel dashboard-capability-panel" aria-labelledby="recent-reviews-title" data-vendor-tour="reviews">
          <div className="dashboard-activity-heading"><h2 id="recent-reviews-title"><Star size={17} /> RECENT REVIEWS</h2><Link to="/vendor/reviews">View all</Link></div>
          <p className="dashboard-activity-state">The current review APIs list reviews for individual items; they do not provide a vendor-wide review feed.</p>
        </section>
      </div>
      <VendorDashboardTour vendorId={vendorId} />
    </VendorLayout>
  );
}

export default VendorDashboardPage;


import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import {
  fetchVendorOrders,
  updateVendorOrderStatus,
  type VendorOrder,
  type VendorOrderFilter,
  type VendorOrderStatus,
} from "../../services/vendorOrdersApi";
import { useVendorBusiness, useVendorBusinesses } from "../../services/vendorBusinessStore";
import {
  fetchVendorBookings,
  updateVendorBookingStatus,
  type VendorBooking,
  type VendorBookingDecision,
} from "../../services/bookings/vendorBookingApi";
import "./VendorOrdersPage.css";

const filters: VendorOrderFilter[] = [
  "ALL",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function formatMoney(value: string | number | undefined) {
  const amount = Number(value ?? 0);
  return `UGX ${amount.toLocaleString("en-UG", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-UG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function nextAction(status: VendorOrderStatus) {
  switch (status) {
    case "PAID":
      return { label: "Start processing", status: "PROCESSING" as const };
    case "PROCESSING":
      return { label: "Mark as shipped", status: "SHIPPED" as const };
    case "SHIPPED":
      return { label: "Mark as delivered", status: "DELIVERED" as const };
    default:
      return null;
  }
}

export default function VendorOrdersPage() {
  const activeBusiness = useVendorBusiness();
  const { businesses, loading: businessesLoading, error: businessesError } = useVendorBusinesses();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [filter, setFilter] = useState<VendorOrderFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null);
  const [bookingNotice, setBookingNotice] = useState("");
  const [now, setNow] = useState<number | null>(null);

  const isServiceBusiness = activeBusiness?.business_type === "SERVICE_PROVIDER";
  const isPetBusiness = activeBusiness?.business_type === "PET_SALE_ADOPTION";
  const showOrders = !activeBusiness || isPetBusiness || activeBusiness.business_type === "PRODUCT_SELLER";
  const showBookings = !activeBusiness || isServiceBusiness;
  const serviceBusinesses = useMemo(
    () => businesses.filter((business) => business.business_type === "SERVICE_PROVIDER"),
    [businesses],
  );
  const bookingScopeAvailable = !activeBusiness || (
    !businessesLoading && !businessesError && serviceBusinesses.length === 1
    && String(serviceBusinesses[0].id) === String(activeBusiness.id)
  );

  const visibleOrders = useMemo(() => {
    if (!activeBusiness) return orders;
    return orders.filter((order) => {
      if (order.business_name !== activeBusiness.name) return false;
      if (isPetBusiness) return order.items?.some((item) => item.item_type === "pet") ?? false;
      if (activeBusiness.business_type === "PRODUCT_SELLER") {
        return order.items?.some((item) => item.item_type === "product") ?? false;
      }
      return false;
    });
  }, [activeBusiness, isPetBusiness, orders]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchVendorOrders(filter);
      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your orders.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!showOrders) return;
    const timer = setTimeout(() => { void loadOrders(); }, 0);
    return () => clearTimeout(timer);
  }, [activeBusiness?.id, loadOrders, showOrders]);

  useEffect(() => {
    const refreshCurrentTime = () => setNow(Date.now());
    refreshCurrentTime();
    const intervalId = window.setInterval(refreshCurrentTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError("");
    try {
      setBookings(await fetchVendorBookings());
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : "Could not load your bookings.");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showBookings || !bookingScopeAvailable) return;
    const timer = setTimeout(() => { void loadBookings(); }, 0);
    return () => clearTimeout(timer);
  }, [bookingScopeAvailable, loadBookings, showBookings]);
  async function handleStatusUpdate(
    order: VendorOrder,
    status: VendorOrderStatus,
  ) {
    const action = status === "CANCELLED" ? "cancel this order" : "update this order";

    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    setUpdatingId(order.id);
    setError("");
    setNotice("");

    try {
      const updatedOrder = await updateVendorOrderStatus(order.id, status);

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? updatedOrder : item,
        ),
      );

      setNotice(`Order #${order.order_id} updated to ${status}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The order could not be updated.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleBookingDecision(booking: VendorBooking, status: VendorBookingDecision) {
    let decisionReason: string | undefined;
    if (status === "declined") {
      const entered = window.prompt("Why are you declining this booking?");
      if (entered === null) return;
      decisionReason = entered.trim();
      if (!decisionReason) {
        setBookingsError("Enter a reason before declining this booking.");
        return;
      }
    }

    setUpdatingBookingId(booking.booking_id);
    setBookingsError("");
    setBookingNotice("");
    try {
      const updated = await updateVendorBookingStatus(booking.booking_id, status, decisionReason);
      setBookings((current) => current.map((item) => item.booking_id === booking.booking_id ? updated : item));
      setBookingNotice(`Booking #${booking.booking_id} ${status}.`);
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : "The booking could not be updated.");
    } finally {
      setUpdatingBookingId(null);
    }
  }

  return (
    <VendorLayout
      title={isServiceBusiness ? "Bookings" : isPetBusiness ? "Pet sales" : activeBusiness ? "Orders" : "Orders & Bookings"}
      description={isServiceBusiness ? "Review customer appointments and respond to booking requests." : "Manage customer purchases and service bookings for your businesses."}
      vendorWorkspace
    >
      <section className="dashboard-content vendor-orders-page">
        {showBookings && (
          <section className="vendor-bookings-section" aria-labelledby="vendor-bookings-title">
            <div className="vendor-orders-toolbar">
              <div>
                <h2 id="vendor-bookings-title">Customer bookings</h2>
                <p>{activeBusiness ? `Bookings for ${activeBusiness.name}.` : "Bookings received by your service businesses."}</p>
              </div>
              <button type="button" className="orders-refresh-button" onClick={() => void loadBookings()} disabled={bookingsLoading || (Boolean(activeBusiness) && !bookingScopeAvailable)}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {!activeBusiness && <p className="vendor-bookings-scope-note">This workspace combines bookings from all your service businesses. The booking API does not include a business name in each record.</p>}
            {activeBusiness && businessesLoading && <p className="orders-message" role="status">Checking which businesses can be safely shown…</p>}
            {activeBusiness && !businessesLoading && (businessesError || !bookingScopeAvailable) && (
              <div className="orders-error" role="alert">
                <AlertCircle size={18} />
                {businessesError
                  ? "We couldn't verify your businesses, so bookings are hidden to prevent showing another business's records. Refresh the page and try again."
                  : "The booking API does not include a business or service ID and has no business filter. Because this vendor has multiple service businesses, bookings cannot be safely separated here."}
              </div>
            )}
            {bookingNotice && <div className="orders-notice" role="status"><CheckCircle2 size={17} />{bookingNotice}</div>}
            {bookingsError && <div className="orders-error" role="alert"><AlertCircle size={18} />{bookingsError}<button type="button" onClick={() => void loadBookings()}>Try again</button></div>}
            {bookingScopeAvailable && bookingsLoading ? (
              <div className="orders-message" role="status"><RefreshCw size={22} className="orders-spinner" /><p>Loading your bookings…</p></div>
            ) : bookingScopeAvailable && !bookingsLoading && !bookingsError && bookings.length === 0 ? (
              <div className="orders-empty-state"><CalendarDays size={38} /><h3>No bookings yet</h3><p>New customer bookings will appear here.</p></div>
            ) : bookingScopeAvailable && !bookingsLoading && bookings.length > 0 ? (
              <div className="vendor-orders-list">
                {bookings.map((booking) => {
                  const isUpdating = updatingBookingId === booking.booking_id;
                  const canComplete = now !== null && booking.status === "accepted" && now >= new Date(booking.end_at).getTime();
                  return (
                    <article className="vendor-order-card vendor-booking-card" key={booking.booking_id}>
                      <div className="vendor-order-card-header">
                        <div><span className="order-reference">{booking.service_name}</span><p className="order-date">Booking #{booking.booking_id} · {formatDate(booking.start_at)}</p></div>
                        <span className={`order-status-badge booking-status-${booking.status}`}>{booking.status}</span>
                      </div>
                      <div className="vendor-order-customer vendor-booking-customer">
                        <div><span className="order-field-label">Customer</span><strong>{booking.customer_name || `Customer #${booking.customer_id}`}</strong></div>
                        <div><span className="order-field-label">Appointment ends</span><strong>{formatDate(booking.end_at)}</strong></div>
                      </div>
                      {booking.notes && <div className="vendor-order-notes"><strong>Customer notes:</strong> {booking.notes}</div>}
                      {booking.decision_reason && <div className="vendor-order-notes"><strong>Decision reason:</strong> {booking.decision_reason}</div>}
                      <div className="vendor-order-actions vendor-booking-actions">
                        {booking.status === "pending" && <>
                          <button type="button" className="order-primary-action" disabled={isUpdating} onClick={() => void handleBookingDecision(booking, "accepted")}>{isUpdating ? "Updating…" : "Accept booking"}</button>
                          <button type="button" className="order-cancel-action" disabled={isUpdating} onClick={() => void handleBookingDecision(booking, "declined")}>Decline booking</button>
                        </>}
                        {canComplete && <button type="button" className="order-primary-action" disabled={isUpdating} onClick={() => void handleBookingDecision(booking, "completed")}>{isUpdating ? "Updating…" : "Mark completed"}</button>}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        )}

        {showOrders && <section className="vendor-business-orders-section" aria-labelledby="vendor-orders-title">
        <div className="vendor-orders-toolbar">
          <div>
            <h2 id="vendor-orders-title">{isPetBusiness ? "Pet sale orders" : activeBusiness ? "Product orders" : "Your orders"}</h2>
            <p>{activeBusiness ? `Manage paid purchases for ${activeBusiness.name}.` : "Manage paid orders received by your businesses."}</p>
          </div>

          <button
            type="button"
            className="orders-refresh-button"
            onClick={() => void loadOrders()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="orders-filter-list" aria-label="Filter orders">
          {filters.map((status) => (
            <button
              type="button"
              key={status}
              className={`orders-filter-button ${
                filter === status ? "selected" : ""
              }`}
              onClick={() => setFilter(status)}
              aria-pressed={filter === status}
            >
              {status === "ALL" ? "All orders" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        {notice && (
          <div className="orders-notice" role="status">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        {error && (
          <div className="orders-error" role="alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="orders-message">
            <RefreshCw size={22} className="orders-spinner" />
            <p>Loading your orders...</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-empty-state">
            <Package size={38} />
            <h3>No orders found</h3>
            <p>
              {filter === "ALL"
                ? activeBusiness ? "Paid orders for this business will appear here." : "Your paid customer orders will appear here."
                : `There are currently no ${filter.toLowerCase()} orders.`}
            </p>
          </div>
        ) : (
          <div className="vendor-orders-list">
            {visibleOrders.map((order) => {
              const action = nextAction(order.status);
              const canCancel =
                order.status === "PAID" || order.status === "PROCESSING";
              const isUpdating = updatingId === order.id;

              return (
                <article className="vendor-order-card" key={order.id}>
                  <div className="vendor-order-card-header">
                    <div>
                      <span className="order-reference">
                        Order #{order.order_id}
                      </span>
                      {!activeBusiness && <span className="vendor-order-business">{order.business_name}</span>}
                      <p className="order-date">
                        Placed {formatDate(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`order-status-badge status-${order.status.toLowerCase()}`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="vendor-order-customer">
                    <div>
                      <span className="order-field-label">Customer</span>
                      <strong>{order.shipping_name || "Not provided"}</strong>
                    </div>
                    <div>
                      <span className="order-field-label">Phone</span>
                      <strong>{order.shipping_phone || "Not provided"}</strong>
                    </div>
                    <div className="order-delivery-address">
                      <span className="order-field-label">Delivery address</span>
                      <strong>
                        {[order.shipping_address, order.shipping_city_district]
                          .filter(Boolean)
                          .join(", ") || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  <div className="vendor-order-items">
                    <h4>Items ordered</h4>
                    {order.items?.map((item, index) => (
                      <div
                        className="vendor-order-item"
                        key={item.id ?? `${order.id}-${index}`}
                      >
                        <div>
                          <strong>
                            {item.item_type === "pet"
                             ? item.pet_name || item.name || "Pet"
                            : item.product_name || item.name || "Product"}
                          </strong>
                          <span>
                             {item.item_type === "pet"
                              ? "Pet for Sale · One pet"
                              : `Quantity: ${item.quantity ?? 1}`}

                          </span>
                        </div>
                        <strong>
                          {formatMoney(item.subtotal ?? item.price)}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="vendor-order-notes">
                      <strong>Customer notes:</strong> {order.notes}
                    </div>
                  )}

                  <div className="vendor-order-card-footer">
                    <div className="vendor-order-total">
                      <span>Order total</span>
                      <strong>{formatMoney(order.total)}</strong>
                    </div>

                    <div className="vendor-order-actions">
                      {action && (
                        <button
                          type="button"
                          className="order-primary-action"
                          disabled={isUpdating}
                          onClick={() =>
                            void handleStatusUpdate(order, action.status)
                          }
                        >
                          {isUpdating ? "Updating..." : action.label}
                        </button>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          className="order-cancel-action"
                          disabled={isUpdating}
                          onClick={() =>
                            void handleStatusUpdate(order, "CANCELLED")
                          }
                        >
                          Cancel order
                        </button>
                      )}

                      {order.status === "DELIVERED" && (
                        <span className="order-completed-label">
                          <CheckCircle2 size={16} /> Completed
                        </span>
                      )}

                      {order.status === "CANCELLED" && (
                        <span className="order-cancelled-label">
                          Order cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </section>}
      </section>
    </VendorLayout>
  );
}

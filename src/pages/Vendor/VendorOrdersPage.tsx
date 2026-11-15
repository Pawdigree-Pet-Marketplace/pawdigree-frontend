
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  RefreshCw,
} from "lucide-react";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import {
  fetchVendorOrders,
  updateVendorOrderStatus,
  type VendorOrder,
  type VendorOrderFilter,
  type VendorOrderStatus,
} from "../../services/vendorOrdersApi";
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
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [filter, setFilter] = useState<VendorOrderFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

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
  const timer = setTimeout(() => {
    void loadOrders();
  }, 0);

  return () => clearTimeout(timer);
}, [loadOrders]);
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

  return (
    <VendorLayout
      title="Orders & Bookings"
      description="View customer orders, prepare purchases and manage deliveries."
      vendorWorkspace
    >
      <section className="dashboard-content vendor-orders-page">
        <div className="vendor-orders-toolbar">
          <div>
            <h2>Your orders</h2>
            <p>Manage the orders placed for your business.</p>
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
        ) : orders.length === 0 ? (
          <div className="orders-empty-state">
            <Package size={38} />
            <h3>No orders found</h3>
            <p>
              {filter === "ALL"
                ? "Your paid customer orders will appear here."
                : `There are currently no ${filter.toLowerCase()} orders.`}
            </p>
          </div>
        ) : (
          <div className="vendor-orders-list">
            {orders.map((order) => {
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
                            {item.product_name || item.name || "Product"}
                          </strong>
                          <span>Quantity: {item.quantity}</span>
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
      </section>
    </VendorLayout>
  );
}

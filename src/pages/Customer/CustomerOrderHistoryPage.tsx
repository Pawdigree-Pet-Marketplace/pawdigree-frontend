
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  PackageCheck,
  CalendarDays,
  MapPin,
  PawPrint,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import {
  getCustomerOrders,
  type CustomerOrder,
} from "../../services/orders/orderApi";

import "./CustomerOrderHistoryPage.css";

export default function CustomerOrderHistoryPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Retrieve the customer's orders when the page loads.
  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const customerOrders = await getCustomerOrders();

        if (isMounted) {
          setOrders(customerOrders);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your orders. Please try again.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Format prices supplied by the backend.
  const formatPrice = (price: string) => `UGX ${price}`;

  // Format the order date.
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-UG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Make backend status values readable.
  const formatStatus = (status: string) =>
    status
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const getStatusClass = (status: string) =>
    status.toLowerCase().replaceAll("_", "-");

  return (
    <div className="customer-orders-layout">
      <CustomerDashboardNav />

      <main className="customer-orders-main">
        {/* PAGE HEADING */}
        <header className="customer-orders-heading">
          <div className="customer-orders-heading-content">
            <p className="customer-orders-eyebrow">
              PAWDIGREE PET STORE
            </p>

            <h1>My Orders</h1>

            <p>
              Keep track of your purchases and follow their delivery
              progress.
            </p>
          </div>

          <div className="customer-orders-decoration" aria-hidden="true">
            <ShoppingBag />
            <PawPrint />
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="customer-orders-error" role="alert">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <section className="customer-orders-empty">
            <p>Loading your orders...</p>
          </section>
        ) : orders.length === 0 && !error ? (
          /* EMPTY ORDER HISTORY */
          <section className="customer-orders-empty">
            <ShoppingBag size={52} />

            <h2>You haven't placed any orders yet</h2>

            <p>
              Your purchases will appear here once you place an order
              at Pawdigree.
            </p>

            <Link to="/" className="customer-orders-shop-link">
              Explore Pawdigree
            </Link>
          </section>
        ) : (
          /* CUSTOMER ORDERS */
          <section className="customer-orders-list">
            <div className="customer-orders-list-heading">
              <div>
                <h2>Your Purchase History</h2>
                <p>
                  {orders.length} {orders.length === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>

            {orders.map((order) => (
              <article className="customer-order-card" key={order.id}>
                {/* ORDER HEADER */}
                <div className="customer-order-header">
                  <div className="customer-order-reference">
                    <span>Order reference</span>
                    <strong>#{order.id}</strong>
                  </div>

                  <span
                    className={`customer-order-status ${getStatusClass(order.status)}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>

                {/* ORDER INFORMATION */}
                <div className="customer-order-information">
                  <div>
                    <CalendarDays size={17} />
                    <span>{formatDate(order.created_at)}</span>
                  </div>

                  <div>
                    <MapPin size={17} />
                    <span>
                      {order.shipping_city_district},{" "}
                      {order.shipping_address}
                    </span>
                  </div>
                </div>

                {/* VENDOR ORDERS */}
                <div className="customer-order-vendors">
                  {order.vendor_orders.map((vendorOrder) => (
                    <div
                      className="customer-order-vendor"
                      key={vendorOrder.id}
                    >
                      <div className="customer-order-vendor-heading">
                        <div>
                          <h3>{vendorOrder.business_name}</h3>
                          <span>Vendor order #{vendorOrder.id}</span>
                        </div>

                        <span
                          className={`customer-order-status ${getStatusClass(vendorOrder.status)}`}
                        >
                          {formatStatus(vendorOrder.status)}
                        </span>
                      </div>

                      {/* PURCHASED PRODUCTS */}
                      <div className="customer-order-products">
                        {vendorOrder.items.map((item) => (
                          <div
                            className="customer-order-product"
                            key={item.id}
                          >
                            <div className="customer-order-product-icon">
                              <PackageCheck size={21} />
                            </div>

                            <div className="customer-order-product-details">
                              <strong>{item.name}</strong>

                              <span>
                                Quantity: {item.quantity}
                              </span>
                            </div>

                            <strong className="customer-order-product-price">
                              {formatPrice(item.subtotal)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ORDER TOTAL */}
                <div className="customer-order-footer">
                  <span>Order Total</span>

                  <strong>
                    {formatPrice(order.total_amount)}
                  </strong>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

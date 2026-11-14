import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  MapPin,
  PackageCheck,
  PawPrint,
  Phone,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import {
  getCustomerOrderById,
  type CustomerOrder,
} from "../../services/orders/orderApi";

import "./CustomerOrderDetailsPage.css";

export default function CustomerOrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Retrieve the selected order using the ID in the URL.
  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      const parsedOrderId = Number(orderId);

      if (
        !orderId ||
        !Number.isInteger(parsedOrderId) ||
        parsedOrderId < 1
      ) {
        setError("The order reference is invalid.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const customerOrder = await getCustomerOrderById(parsedOrderId);

        if (isMounted) {
          setOrder(customerOrder);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this order. Please try again.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Format prices returned by the backend.
  const formatPrice = (price: string) => {
    const amount = Number(price);

    return Number.isFinite(amount)
      ? `UGX ${amount.toLocaleString("en-UG")}`
      : `UGX ${price}`;
  };

  // Format the order date and time.
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-UG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
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
    <div className="customer-order-details-layout">
      <CustomerDashboardNav />

      <main className="customer-order-details-main">
        {/* PAGE HEADING */}
        <header className="customer-order-details-heading">
          <div className="customer-order-details-heading-content">
            <p className="customer-order-details-eyebrow">
              PAWDIGREE PET STORE
            </p>

            <h1>Order Details</h1>

            <p>
              View your purchase information, vendor orders and delivery
              details.
            </p>
          </div>

          <div
            className="customer-order-details-decoration"
            aria-hidden="true"
          >
            <ShoppingBag />
            <PawPrint />
          </div>
        </header>

        {/* BACK TO ORDER HISTORY */}
        <Link
          to="/customer/orders"
          className="customer-order-details-back"
        >
          <ArrowLeft size={18} />
          Back to My Orders
        </Link>

        {/* LOADING STATE */}
        {loading && (
          <section className="customer-order-details-state">
            <PackageCheck size={42} />
            <p>Loading your order details...</p>
          </section>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <section
            className="customer-order-details-state customer-order-details-error"
            role="alert"
          >
            <ShoppingBag size={42} />
            <h2>Unable to load order</h2>
            <p>{error}</p>

            <Link
              to="/customer/orders"
              className="customer-order-details-button"
            >
              Return to My Orders
            </Link>
          </section>
        )}

        {/* ORDER DETAILS */}
        {!loading && !error && order && (
          <div className="customer-order-details-content">
            {/* ORDER SUMMARY */}
            <section className="customer-order-details-card">
              <div className="customer-order-details-summary-header">
                <div>
                  <span className="customer-order-details-label">
                    Order reference
                  </span>

                  <h2>#{order.id}</h2>
                </div>

                <span
                  className={`customer-order-details-status ${getStatusClass(order.status)}`}
                >
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="customer-order-details-date">
                <CalendarDays size={18} />
                <span>Placed on {formatDate(order.created_at)}</span>
              </div>
            </section>

            {/* VENDOR ORDERS AND PRODUCTS */}
            <section className="customer-order-details-section">
              <div className="customer-order-details-section-heading">
                <PackageCheck size={21} />
                <h2>Items in Your Order</h2>
              </div>

              {order.vendor_orders.map((vendorOrder) => (
                <article
                  className="customer-order-details-vendor"
                  key={vendorOrder.id}
                >
                  <div className="customer-order-details-vendor-header">
                    <div className="customer-order-details-vendor-name">
                      <Store size={20} />

                      <div>
                        <h3>{vendorOrder.business_name}</h3>
                        <span>Vendor order #{vendorOrder.id}</span>
                      </div>
                    </div>

                    <span
                      className={`customer-order-details-status ${getStatusClass(vendorOrder.status)}`}
                    >
                      {formatStatus(vendorOrder.status)}
                    </span>
                  </div>

                  <div className="customer-order-details-items">
                    {vendorOrder.items.map((item) => (
                      <div
                        className="customer-order-details-item"
                        key={item.id}
                      >
                        <div className="customer-order-details-item-icon">
                          <PackageCheck size={22} />
                        </div>

                        <div className="customer-order-details-item-info">
                          <strong>{item.name}</strong>

                          <span>
                            Quantity: {item.quantity}
                          </span>

                          <span>
                            Unit price: {formatPrice(item.unit_price)}
                          </span>
                        </div>

                        <strong className="customer-order-details-item-subtotal">
                          {formatPrice(item.subtotal)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            {/* ORDER TOTALS */}
            <section className="customer-order-details-card">
              <div className="customer-order-details-section-heading">
                <ShoppingBag size={21} />
                <h2>Payment Summary</h2>
              </div>

              <div className="customer-order-details-total-row">
                <span>Items subtotal</span>
                <strong>{formatPrice(order.items_subtotal)}</strong>
              </div>

              <div className="customer-order-details-total-row customer-order-details-grand-total">
                <span>Order total</span>
                <strong>{formatPrice(order.total_amount)}</strong>
              </div>

              <div className="customer-order-details-delivery-note">
                <Truck size={20} />

                <p>
                  Delivery fees are not included in this order total.
                  You will pay the delivery fee separately when your
                  order is delivered.
                </p>
              </div>
            </section>

            {/* DELIVERY INFORMATION */}
            <section className="customer-order-details-card">
              <div className="customer-order-details-section-heading">
                <MapPin size={21} />
                <h2>Delivery Information</h2>
              </div>

              <div className="customer-order-details-contact-grid">
                <div className="customer-order-details-contact-item">
                  <UserRound size={19} />

                  <div>
                    <span>Recipient</span>
                    <strong>{order.shipping_name}</strong>
                  </div>
                </div>

                <div className="customer-order-details-contact-item">
                  <Phone size={19} />

                  <div>
                    <span>Phone number</span>
                    <strong>{order.shipping_phone}</strong>
                  </div>
                </div>

                <div className="customer-order-details-contact-item">
                  <MapPin size={19} />

                  <div>
                    <span>City / District</span>
                    <strong>{order.shipping_city_district}</strong>
                  </div>
                </div>

                <div className="customer-order-details-contact-item">
                  <Truck size={19} />

                  <div>
                    <span>Delivery address</span>
                    <strong>{order.shipping_address}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* CUSTOMER NOTES */}
            {order.notes && (
              <section className="customer-order-details-card">
                <div className="customer-order-details-section-heading">
                  <FileText size={21} />
                  <h2>Order Notes</h2>
                </div>

                <p className="customer-order-details-notes">
                  {order.notes}
                </p>
              </section>
            )}

            {/* BOTTOM NAVIGATION */}
            <div className="customer-order-details-bottom">
              <Link
                to="/customer/orders"
                className="customer-order-details-button"
              >
                <ArrowLeft size={17} />
                Back to My Orders
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

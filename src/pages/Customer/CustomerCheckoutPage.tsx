
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle,
  PawPrint,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import { useCart } from "../../context/CartContext";
import {
  createCheckoutOrder,
  type CheckoutPayload,
  type CustomerOrder,
} from "../../services/orders/orderApi";

import "./CustomerCheckoutPage.css";

export default function CustomerCheckoutPage() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    hasUnavailableItems,
    loading,
  } = useCart();

  const [formData, setFormData] = useState<CheckoutPayload>({
    shipping_name: "",
    shipping_phone: "",
    shipping_address: "",
    shipping_city_district: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] =
    useState<CustomerOrder | null>(null);

  // Update a form field when the customer types.
  function handleChange(
    field: keyof CheckoutPayload,
    value: string,
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Submit the shipping details and create the order.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const order = await createCheckoutOrder(formData);
      setCreatedOrder(order);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to place your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Format prices supplied by the backend or cart.
  const formatPrice = (price: string) => `UGX ${price}`;

  // Show the order confirmation after the backend creates it.
  if (createdOrder) {
    return (
      <div className="customer-checkout-layout">
        <CustomerDashboardNav />

        <main className="customer-checkout-main">
          <section className="customer-checkout-confirmation">
            <CheckCircle size={58} />

            <p className="customer-checkout-eyebrow">
              PAWDIGREE PET STORE
            </p>

            <h1>Your order has been created!</h1>

            <p>
              Your order reference is{" "}
              <strong>#{createdOrder.id}</strong>.
            </p>

            <div className="customer-checkout-pending">
              <Clock size={20} />

              <div>
                <strong>Pending payment</strong>
                <p>
                  Your order is awaiting payment confirmation.
                </p>
              </div>
            </div>

            {createdOrder.expires_at && (
              <p className="customer-checkout-expiry">
                Payment deadline:{" "}
                {new Date(createdOrder.expires_at).toLocaleString(
                  "en-UG",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  },
                )}
              </p>
            )}

            <div className="customer-checkout-confirmation-total">
              <span>Order total</span>
              <strong>
                {formatPrice(createdOrder.total_amount)}
              </strong>
            </div>

            <p className="customer-checkout-confirmation-note">
              Your cart has not been cleared. It will remain available
              until payment is confirmed.
            </p>

            <Link
              to="/customer/orders"
              className="customer-checkout-primary-button"
            >
              View My Orders
            </Link>

            <Link
              to="/customer/cart"
              className="customer-checkout-secondary-link"
            >
              Return to Cart
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="customer-checkout-layout">
      <CustomerDashboardNav />

      <main className="customer-checkout-main">
        {/* PAGE HEADING */}
        <header className="customer-checkout-heading">
          <div>
            <p className="customer-checkout-eyebrow">
              PAWDIGREE PET STORE
            </p>

            <h1>Checkout</h1>

            <p>
              Provide your delivery details to place your merchandise
              order.
            </p>
          </div>

          <PawPrint aria-hidden="true" />
        </header>

        {loading ? (
          <section className="customer-checkout-message">
            Loading your cart...
          </section>
        ) : cartItems.length === 0 ? (
          <section className="customer-checkout-message">
            <ShoppingBag size={48} />

            <h2>Your cart is empty</h2>

            <p>Add merchandise to your cart before checking out.</p>

            <Link to="/customer/cart">
              Return to Cart
            </Link>
          </section>
        ) : (
          <div className="customer-checkout-content">
            {/* SHIPPING DETAILS FORM */}
            <section className="customer-checkout-form-section">
              <div className="customer-checkout-section-heading">
                <MapPin size={22} />

                <div>
                  <h2>Delivery Information</h2>
                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              {error && (
                <div className="customer-checkout-error" role="alert">
                  {error}
                </div>
              )}

              {hasUnavailableItems && (
                <div className="customer-checkout-error" role="alert">
                  Your cart contains unavailable items. Return to your
                  cart and resolve these items before checking out.
                  <Link to="/customer/cart">Review Cart</Link>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="customer-checkout-field">
                  <label htmlFor="shipping_name">
                    Full Name <span>*</span>
                  </label>

                  <input
                    id="shipping_name"
                    type="text"
                    name="shipping_name"
                    placeholder="Enter your full name"
                    maxLength={150}
                    autoComplete="name"
                    required
                    value={formData.shipping_name}
                    onChange={(event) =>
                      handleChange("shipping_name", event.target.value)
                    }
                  />
                </div>

                <div className="customer-checkout-field">
                  <label htmlFor="shipping_phone">
                    Phone Number <span>*</span>
                  </label>

                  <input
                    id="shipping_phone"
                    type="tel"
                    name="shipping_phone"
                    placeholder="+256 7XX XXX XXX"
                    maxLength={20}
                    autoComplete="tel"
                    required
                    value={formData.shipping_phone}
                    onChange={(event) =>
                      handleChange("shipping_phone", event.target.value)
                    }
                  />

                  <small>
                    Enter a phone number where the delivery team can
                    reach you.
                  </small>
                </div>

                <div className="customer-checkout-field">
                  <label htmlFor="shipping_city_district">
                    City / District <span>*</span>
                  </label>

                  <input
                    id="shipping_city_district"
                    type="text"
                    name="shipping_city_district"
                    placeholder="e.g. Kampala"
                    maxLength={100}
                    autoComplete="address-level2"
                    required
                    value={formData.shipping_city_district}
                    onChange={(event) =>
                      handleChange(
                        "shipping_city_district",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="customer-checkout-field">
                  <label htmlFor="shipping_address">
                    Delivery Address <span>*</span>
                  </label>

                  <textarea
                    id="shipping_address"
                    name="shipping_address"
                    placeholder="Enter your street, building, area or other delivery details"
                    maxLength={255}
                    autoComplete="street-address"
                    rows={3}
                    required
                    value={formData.shipping_address}
                    onChange={(event) =>
                      handleChange("shipping_address", event.target.value)
                    }
                  />
                </div>

                <div className="customer-checkout-field">
                  <label htmlFor="notes">
                    Additional Delivery Notes
                    <span className="optional-label"> (Optional)</span>
                  </label>

                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional instructions for your delivery?"
                    rows={3}
                    value={formData.notes}
                    onChange={(event) =>
                      handleChange("notes", event.target.value)
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="customer-checkout-primary-button"
                  disabled={submitting || hasUnavailableItems}
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>

                <p className="customer-checkout-secure-note">
                  Your order will be created with a pending payment
                  status. Payment is not processed by this form.
                </p>
              </form>
            </section>

            {/* ORDER SUMMARY */}
            <aside className="customer-checkout-summary">
              <h2>Order Summary</h2>

              <p className="customer-checkout-item-count">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>

              <div className="customer-checkout-products">
                {cartItems.map((item) => (
                  <div
                    className="customer-checkout-product"
                    key={item.id}
                  >
                    <div>
                      <strong>{item.name}</strong>

                      <span>
                        {item.business_name} · Qty: {item.quantity}
                      </span>
                    </div>

                    <strong>{formatPrice(item.line_total)}</strong>
                  </div>
                ))}
              </div>

              <div className="customer-checkout-total">
                <span>Subtotal</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              <p className="customer-checkout-delivery-note">
                Delivery fees, if applicable, will be calculated
                separately.
              </p>

              <Link
                to="/customer/cart"
                className="customer-checkout-edit-link"
              >
                Edit Cart
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle,
  PawPrint,
  CreditCard,
  Smartphone,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import { useCart } from "../../context/CartContext";

import {
  createCheckoutOrder,
  type CheckoutPayload,
  type CustomerOrder,
} from "../../services/orders/orderApi";

import {
  getPaymentMethods,
  startPayment,
} from "../../services/payments/paymentApi";

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

  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [currency, setCurrency] = useState("UGX");
  const [selectedMethod, setSelectedMethod] = useState("");

  const [methodsLoading, setMethodsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);

  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] =
    useState<CustomerOrder | null>(null);

  // Load the payment methods supported by the backend.
  useEffect(() => {
    async function loadPaymentMethods() {
      setMethodsLoading(true);
      setError("");

      try {
        const response = await getPaymentMethods();

        setPaymentMethods(response.methods);
        setCurrency(response.currency);

        if (response.methods.length > 0) {
          setSelectedMethod(response.methods[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payment methods.",
        );
      } finally {
        setMethodsLoading(false);
      }
    }

    loadPaymentMethods();
  }, []);

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

  // Convert backend method names into readable labels.
  function getMethodLabel(method: string) {
    switch (method) {
      case "card":
        return "Card";

      case "mobile_money":
        return "Mobile Money";

      default:
        return method
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  }

  // Start payment for an order that has already been created.
  // This function can be called again without creating another order.
  async function handleStartPayment(orderId: number) {
    if (!selectedMethod) {
      setError("Please select a payment method.");
      return;
    }

    setError("");
    setStartingPayment(true);

    try {
      const payment = await startPayment(orderId, selectedMethod);

      if (!payment.payment_url) {
        throw new Error("The backend did not provide a payment link.");
      }

      // Redirect the customer to the sandbox payment page.
      window.location.assign(payment.payment_url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment. Please try again.",
      );
    } finally {
      setStartingPayment(false);
    }
  }

  // Create the order once, then start its payment.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMethod) {
      setError("Please select a payment method.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const order = await createCheckoutOrder(formData);

      // Save the order before attempting payment.
      // A payment failure must not cause another order to be created.
      setCreatedOrder(order);

      // Start payment using the newly created order.
      await handleStartPayment(order.id);
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

  // Format prices using the currency returned by the backend.
  const formatPrice = (price: string) =>
    `${currency} ${Number(price).toLocaleString("en-UG")}`;

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

            {error && (
              <div className="customer-checkout-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="button"
              className="customer-checkout-primary-button"
              disabled={startingPayment}
              onClick={() => handleStartPayment(createdOrder.id)}
            >
              {startingPayment
                ? "Starting Payment..."
                : "Continue to Payment"}
            </button>

            <p className="customer-checkout-secure-note">
              If payment did not open, you can try again using the
              button above. Your existing order will be used.
            </p>

            <p className="customer-checkout-confirmation-note">
              This is a sandbox payment for testing. No real money
              will be charged. Your cart is not manually cleared
              during checkout.
            </p>

            <Link
              to="/customer/orders"
              className="customer-checkout-secondary-link"
            >
              View My Orders
            </Link>

            <br />

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
            {/* SHIPPING DETAILS AND PAYMENT FORM */}
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

                {/* PAYMENT METHOD SELECTION */}
                <div className="customer-checkout-payment-section">
                  <div className="customer-checkout-section-heading">
                    <CreditCard size={22} />

                    <div>
                      <h2>Payment Method</h2>
                      <p>Choose how you would like to pay.</p>
                    </div>
                  </div>

                  {methodsLoading ? (
                    <p className="customer-checkout-payment-message">
                      Loading available payment methods...
                    </p>
                  ) : paymentMethods.length === 0 ? (
                    <p className="customer-checkout-payment-message">
                      No payment methods are currently available.
                      Please try again later.
                    </p>
                  ) : (
                    <div className="customer-checkout-payment-options">
                      {paymentMethods.map((method) => (
                        <label
                          key={method}
                          className={`customer-checkout-payment-option ${
                            selectedMethod === method ? "selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={method}
                            checked={selectedMethod === method}
                            onChange={() => setSelectedMethod(method)}
                          />

                          {method === "mobile_money" ? (
                            <Smartphone size={22} />
                          ) : (
                            <CreditCard size={22} />
                          )}

                          <span>{getMethodLabel(method)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="customer-checkout-primary-button"
                  disabled={
                    submitting ||
                    methodsLoading ||
                    paymentMethods.length === 0 ||
                    !selectedMethod ||
                    hasUnavailableItems
                  }
                >
                  {submitting
                    ? "Creating Order..."
                    : "Place Order & Continue to Payment"}
                </button>

                <p className="customer-checkout-secure-note">
                  You will be redirected to a sandbox payment page.
                  This is a test integration and does not charge real
                  money.
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
                 Delivery fees are not included in this payment. You will pay
                 the delivery fee separately when your order is delivered.
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
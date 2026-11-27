
import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  CreditCard,
  XCircle,
  Clock,
  Smartphone,
  PawPrint,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import { useCart } from "../../context/CartContext";

import {
  getPaymentStatus,
  simulateSandboxPayment,
  type Payment,
  type SandboxPaymentResult,
} from "../../services/payments/paymentApi";

import "./SandboxPaymentPage.css";

type CustomerPaymentMethod = "mobile_money" | "airtel_money" | "card";

type PaymentDetails = {
  phoneNumber: string;
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

type PaymentDetailField = keyof PaymentDetails;

const customerPaymentMethods: Array<{
  id: CustomerPaymentMethod;
  label: string;
  description: string;
}> = [
  {
    id: "mobile_money",
    label: "Mobile Money",
    description: "Pay using your mobile money wallet.",
  },
  {
    id: "airtel_money",
    label: "Airtel Money",
    description: "Pay using your Airtel Money wallet.",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Enter card details for this demo only.",
  },
];

type DeliveryInformation = {
  shipping_name: string;
  shipping_phone: string;
  shipping_city_district: string;
  shipping_address: string;
  notes?: string;
  district?: string;
  city?: string;
};

function isDeliveryInformation(value: unknown): value is DeliveryInformation {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.shipping_name === "string" &&
    typeof record.shipping_phone === "string" &&
    typeof record.shipping_city_district === "string" &&
    typeof record.shipping_address === "string"
  );
}

export default function SandboxPaymentPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    refreshCart,
    cartItems,
    cartCount,
    cartTotal,
    hasUnavailableItems,
    loading: cartLoading,
    error: cartError,
  } = useCart();

  const isCustomerPaymentPage = location.pathname === "/customer/payment";
  const routeState = location.state;
  const deliveryInformation = isCustomerPaymentPage &&
    routeState &&
    typeof routeState === "object" &&
    "deliveryInformation" in routeState
      ? routeState.deliveryInformation
      : undefined;
  const hasDeliveryInformation = isDeliveryInformation(deliveryInformation);

  const reference = searchParams.get("reference") ?? "";
  const orderIdValue = searchParams.get("order_id") ?? "";
  const orderId = Number(orderIdValue);

  const validOrderId =
    orderIdValue.trim() !== "" &&
    Number.isInteger(orderId) &&
    orderId > 0;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cartRefreshError, setCartRefreshError] = useState("");
  const [selectedCustomerMethod, setSelectedCustomerMethod] =
    useState<CustomerPaymentMethod>("mobile_money");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    phoneNumber: "",
    cardholder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [paymentFieldErrors, setPaymentFieldErrors] = useState<
    Partial<Record<PaymentDetailField, string>>
  >({});
  const [customerPaymentError, setCustomerPaymentError] = useState("");

  // Load the payment belonging to this order.
  useEffect(() => {
    if (isCustomerPaymentPage) return;

    let active = true;

    async function loadPayment() {
      if (!reference || !validOrderId) {
        setError("The payment link is missing a valid reference or order ID.");
        setLoading(false);
        return;
      }

      try {
        const result = await getPaymentStatus(orderId);

        if (!active) return;

        setPayment(result);

        if (result.status === "PAID") {
          try {
            await refreshCart();
          } catch {
            if (active) {
              setCartRefreshError(
                "Payment succeeded, but your cart could not refresh. Please refresh the page.",
              );
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment details.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayment();

    return () => {
      active = false;
    };
  }, [
    reference,
    validOrderId,
    orderId,
    refreshCart,
    isCustomerPaymentPage,
  ]);

  // Process the payment confirmation.
  async function handleSimulation(result: SandboxPaymentResult) {
    if (!reference) {
      setError("The payment reference is missing.");
      return;
    }

    setError("");
    setCartRefreshError("");
    setProcessing(true);

    try {
      const updatedPayment = await simulateSandboxPayment(
        reference,
        result,
      );

      setPayment(updatedPayment);

      if (updatedPayment.status === "PAID") {
        try {
          await refreshCart();
        } catch {
          setCartRefreshError(
            "Payment succeeded, but your cart could not refresh. Please refresh the page.",
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process your payment.",
      );
    } finally {
      setProcessing(false);
    }
  }

  function updatePaymentDetail(field: PaymentDetailField, value: string) {
    setPaymentDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
    setPaymentFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
    setCustomerPaymentError("");
  }

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits;
  }

  function handleCustomerPaymentSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!hasDeliveryInformation) {
      setCustomerPaymentError(
        "Complete your delivery information before continuing."
      );
      return;
    }

    const nextErrors: Partial<Record<PaymentDetailField, string>> = {};
    if (selectedCustomerMethod === "mobile_money" ||
        selectedCustomerMethod === "airtel_money") {
      const digits = paymentDetails.phoneNumber.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) {
        nextErrors.phoneNumber =
          "Enter a valid phone number with 8 to 15 digits.";
      }
    } else {
      const cardDigits = paymentDetails.cardNumber.replace(/\D/g, "");
      if (!paymentDetails.cardholder.trim()) {
        nextErrors.cardholder = "Enter the name shown on the card.";
      }
      if (cardDigits.length < 12 || cardDigits.length > 19) {
        nextErrors.cardNumber = "Enter a card number with 12 to 19 digits.";
      }
      const expiryMatch = paymentDetails.expiry.match(
        /^(0[1-9]|1[0-2])\/(\d{2})$/
      );
      if (!expiryMatch) {
        nextErrors.expiry = "Enter a valid expiry date in MM/YY format.";
      } else {
        const month = Number(expiryMatch[1]);
        const year = Number(expiryMatch[2]);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (
          year < currentYear ||
          (year === currentYear && month < currentMonth)
        ) {
          nextErrors.expiry = "The card expiry date has passed.";
        }
      }
      if (!/^\d{3,4}$/.test(paymentDetails.cvv)) {
        nextErrors.cvv = "Enter a 3 or 4 digit security code.";
      }
    }

    setPaymentFieldErrors(nextErrors);
    setCustomerPaymentError("");

    const firstInvalidField = Object.keys(nextErrors)[0] as
      | PaymentDetailField
      | undefined;
    if (firstInvalidField) {
      document.getElementById(`customer-payment-${firstInvalidField}`)?.focus();
      return;
    }

    if (hasUnavailableItems) {
      setCustomerPaymentError(
        "Your cart contains unavailable items. Review your cart before continuing."
      );
      return;
    }

    navigate("/customer/receipt", {
      state: {
        paymentDemonstration: true,
        paymentMethod: selectedCustomerMethod,
        deliveryInformation,
      },
    });
  }

  function formatCustomerPrice(amount: string | number) {
    const value = Number(amount);
    return Number.isFinite(value)
      ? `UGX ${value.toLocaleString("en-UG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : `UGX ${amount}`;
  }

  function formatCategorySubtotal(
    items: typeof cartItems
  ) {
    return formatCustomerPrice(
      items.reduce((total, item) => total + Number(item.line_total), 0)
    );
  }

  function formatAmount(amount: string, currency: string) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return `${currency} ${amount}`;
    }

    return `${currency} ${value.toLocaleString("en-UG")}`;
  }

  function getMethodLabel(method: string) {
    switch (method) {
      case "card":
        return "Card";

      case "mobile_money":
        return "Mobile Money";

      default:
        return method;
    }
  }

  const isPaid = payment?.status === "PAID";
  const isFailed = payment?.status === "FAILED";
  const isPending = payment?.status === "PENDING";
  const petItems = cartItems.filter((item) => item.item_type === "pet");
  const merchandiseItems = cartItems.filter(
    (item) => item.item_type !== "pet"
  );

  function renderPaymentFieldError(field: PaymentDetailField) {
    const message = paymentFieldErrors[field];
    if (!message) return null;

    return (
      <small
        className="customer-payment-field-error"
        id={`customer-payment-${field}-error`}
        role="alert"
      >
        {message}
      </small>
    );
  }

  if (isCustomerPaymentPage) {
    return (
      <div className="sandbox-payment-layout">
        <CustomerDashboardNav />

        <main className="sandbox-payment-main customer-payment-main">
          <header className="sandbox-payment-heading customer-payment-heading">
            <div>
              <p className="sandbox-payment-eyebrow">PAWDIGREE PET STORE</p>
              <h1>Payment</h1>
              <p>
                Choose your preferred payment method to complete your Pawdigree
                order.
              </p>
            </div>
            <PawPrint
              className="customer-payment-hero-paw"
              aria-hidden="true"
            />
            <Sparkles
              className="customer-payment-hero-sparkle"
              aria-hidden="true"
            />
          </header>

          {cartError && (
            <div className="sandbox-payment-error" role="alert">
              {cartError}
            </div>
          )}

          {customerPaymentError && (
            <div className="sandbox-payment-error" role="alert">
              {customerPaymentError}
            </div>
          )}

          {cartLoading ? (
            <section className="sandbox-payment-card sandbox-payment-loading">
              <Clock size={34} aria-hidden="true" />
              <p>Loading your order...</p>
            </section>
          ) : cartItems.length === 0 ? (
            <section className="sandbox-payment-card customer-payment-empty">
              <ShoppingBag size={42} aria-hidden="true" />
              <h2>Your cart is empty</h2>
              <p>Return to your cart to review your order.</p>
              <Link to="/customer/cart" className="sandbox-payment-back-link">
                <ArrowLeft size={16} />
                Back to Cart
              </Link>
            </section>
          ) : !hasDeliveryInformation ? (
            <section className="sandbox-payment-card customer-payment-empty">
              <h2>Checkout information is missing</h2>
              <p>Complete your delivery details before selecting a payment method.</p>
              <Link
                to="/customer/checkout"
                className="sandbox-payment-back-link"
              >
                <ArrowLeft size={16} />
                Back to Checkout
              </Link>
            </section>
          ) : (
            <div className="customer-payment-content">
              <section className="customer-payment-panel">
                <div className="customer-payment-gateway">
                  <span className="customer-payment-gateway-mark" aria-hidden="true">
                    P
                  </span>
                  <div className="customer-payment-gateway-copy">
                    <span className="customer-payment-kicker">
                      Selected payment gateway
                    </span>
                    <h2>Pesapal</h2>
                    <p>
                      Pesapal is the payment gateway for this transaction.
                    </p>
                  </div>
                  <span className="customer-payment-selected">
                    <Check size={14} aria-hidden="true" />
                    Selected
                  </span>
                </div>

                {hasUnavailableItems && (
                  <div className="sandbox-payment-error" role="alert">
                    Your cart contains unavailable items. Please review it
                    before continuing.
                    <Link to="/customer/cart">Review Cart</Link>
                  </div>
                )}

                <form
                  onSubmit={handleCustomerPaymentSubmit}
                  noValidate
                >
                  <fieldset className="customer-payment-methods">
                    <legend>Choose a payment method</legend>
                    <div className="customer-payment-method-options">
                      {customerPaymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`customer-payment-method${
                            selectedCustomerMethod === method.id
                              ? " is-selected"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="customer-payment-method"
                            value={method.id}
                            checked={selectedCustomerMethod === method.id}
                            onChange={() => {
                              setSelectedCustomerMethod(method.id);
                              setPaymentFieldErrors({});
                              setCustomerPaymentError("");
                            }}
                          />
                          <span className="customer-payment-method-icon">
                            {method.id === "card" ? (
                              <CreditCard size={22} aria-hidden="true" />
                            ) : method.id === "airtel_money" ? (
                              <span
                                className="customer-payment-airtel-mark"
                                aria-hidden="true"
                              >
                                A
                              </span>
                            ) : (
                              <Smartphone size={22} aria-hidden="true" />
                            )}
                          </span>
                          <span className="customer-payment-method-copy">
                            <strong>{method.label}</strong>
                            <small>{method.description}</small>
                          </span>
                          {selectedCustomerMethod === method.id && (
                            <CheckCircle
                              className="customer-payment-method-check"
                              size={18}
                              aria-hidden="true"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <section
                    className="customer-payment-details"
                    aria-labelledby="customer-payment-details-heading"
                  >
                    <div className="customer-payment-details-heading">
                      <div>
                        <h2 id="customer-payment-details-heading">
                          {selectedCustomerMethod === "card"
                            ? "Card details"
                            : "Mobile payment details"}
                        </h2>
                        <p>
                          Enter demo details only. Nothing here is saved or
                          transmitted.
                        </p>
                      </div>
                      <ShieldCheck size={20} aria-hidden="true" />
                    </div>

                    {selectedCustomerMethod !== "card" ? (
                      <div className="customer-payment-field">
                        <label htmlFor="customer-payment-phoneNumber">
                          {selectedCustomerMethod === "airtel_money"
                            ? "Airtel Money phone number"
                            : "Mobile Money phone number"}
                        </label>
                        <input
                          id="customer-payment-phoneNumber"
                          type="tel"
                          inputMode="tel"
                          autoComplete="off"
                          placeholder="+256 7XX XXX XXX"
                          value={paymentDetails.phoneNumber}
                          aria-invalid={Boolean(
                            paymentFieldErrors.phoneNumber
                          )}
                          aria-describedby={
                            paymentFieldErrors.phoneNumber
                              ? "customer-payment-phoneNumber-error"
                              : undefined
                          }
                          onChange={(event) =>
                            updatePaymentDetail(
                              "phoneNumber",
                              event.target.value.replace(/[^\d+()\s-]/g, "").slice(0, 20)
                            )
                          }
                        />
                        {renderPaymentFieldError("phoneNumber")}
                      </div>
                    ) : (
                      <div className="customer-payment-card-fields">
                        <div className="customer-payment-field customer-payment-cardholder">
                          <label htmlFor="customer-payment-cardholder">
                            Cardholder Name
                          </label>
                          <input
                            id="customer-payment-cardholder"
                            type="text"
                            autoComplete="off"
                            placeholder="Name shown on card"
                            maxLength={80}
                            value={paymentDetails.cardholder}
                            aria-invalid={Boolean(
                              paymentFieldErrors.cardholder
                            )}
                            aria-describedby={
                              paymentFieldErrors.cardholder
                                ? "customer-payment-cardholder-error"
                                : undefined
                            }
                            onChange={(event) =>
                              updatePaymentDetail(
                                "cardholder",
                                event.target.value
                              )
                            }
                          />
                          {renderPaymentFieldError("cardholder")}
                        </div>
                        <div className="customer-payment-field customer-payment-card-number">
                          <label htmlFor="customer-payment-cardNumber">
                            Card Number
                          </label>
                          <input
                            id="customer-payment-cardNumber"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="0000 0000 0000 0000"
                            maxLength={23}
                            value={paymentDetails.cardNumber}
                            aria-invalid={Boolean(
                              paymentFieldErrors.cardNumber
                            )}
                            aria-describedby={
                              paymentFieldErrors.cardNumber
                                ? "customer-payment-cardNumber-error"
                                : undefined
                            }
                            onChange={(event) =>
                              updatePaymentDetail(
                                "cardNumber",
                                formatCardNumber(event.target.value)
                              )
                            }
                          />
                          {renderPaymentFieldError("cardNumber")}
                        </div>
                        <div className="customer-payment-field">
                          <label htmlFor="customer-payment-expiry">
                            Expiry Date
                          </label>
                          <input
                            id="customer-payment-expiry"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={paymentDetails.expiry}
                            aria-invalid={Boolean(paymentFieldErrors.expiry)}
                            aria-describedby={
                              paymentFieldErrors.expiry
                                ? "customer-payment-expiry-error"
                                : undefined
                            }
                            onChange={(event) =>
                              updatePaymentDetail(
                                "expiry",
                                formatExpiry(event.target.value)
                              )
                            }
                          />
                          {renderPaymentFieldError("expiry")}
                        </div>
                        <div className="customer-payment-field">
                          <label htmlFor="customer-payment-cvv">CVV</label>
                          <input
                            id="customer-payment-cvv"
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="•••"
                            maxLength={4}
                            value={paymentDetails.cvv}
                            aria-invalid={Boolean(paymentFieldErrors.cvv)}
                            aria-describedby={
                              paymentFieldErrors.cvv
                                ? "customer-payment-cvv-error"
                                : undefined
                            }
                            onChange={(event) =>
                              updatePaymentDetail(
                                "cvv",
                                event.target.value.replace(/\D/g, "").slice(0, 4)
                              )
                            }
                          />
                          {renderPaymentFieldError("cvv")}
                        </div>
                      </div>
                    )}
                  </section>

                  <p className="customer-payment-demo-note" role="note">
                    <ShieldCheck size={16} aria-hidden="true" />
                    Demonstration only — do not enter real payment details.
                    This will not process or complete a payment.
                  </p>

                  <div className="customer-payment-actions">
                    <Link
                      to="/customer/checkout"
                      className="sandbox-payment-back-link"
                    >
                      <ArrowLeft size={16} />
                      Back to Checkout
                    </Link>
                    <button
                      type="submit"
                      className="customer-payment-continue"
                      disabled={hasUnavailableItems}
                    >
                      Continue to Receipt Preview
                    </button>
                  </div>
                </form>
              </section>

              <aside className="customer-payment-summary">
                <h2>Order Summary</h2>
                <p className="customer-payment-item-count">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </p>
                <div className="customer-payment-products">
                  {cartItems.map((item) => (
                    <div className="customer-payment-product" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.item_type === "pet"
                            ? `${item.business_name} · Pet · Qty: 1`
                            : `${item.business_name} · Merchandise · Qty: ${item.quantity}`}
                        </span>
                      </div>
                      <strong>{formatCustomerPrice(item.line_total)}</strong>
                    </div>
                  ))}
                </div>
                <div className="customer-payment-summary-row">
                  <span>Pet Sales Subtotal</span>
                  <strong>{formatCategorySubtotal(petItems)}</strong>
                </div>
                <div className="customer-payment-summary-row">
                  <span>Merchandise Subtotal</span>
                  <strong>{formatCategorySubtotal(merchandiseItems)}</strong>
                </div>
                <div className="customer-payment-summary-row">
                  <span>Delivery Fee</span>
                  <strong>Calculated separately</strong>
                </div>
                <div className="customer-payment-total">
                  <span>Amount Payable</span>
                  <strong>{formatCustomerPrice(cartTotal)}</strong>
                </div>
                <p className="customer-payment-summary-note">
                  Delivery fee, if applicable, will be calculated separately.
                </p>
              </aside>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="sandbox-payment-layout">
      <CustomerDashboardNav />

      <main className="sandbox-payment-main">
        <header className="sandbox-payment-heading">
          <div>
            <p className="sandbox-payment-eyebrow">
              PAWDIGREE PET STORE
            </p>
            <h1>Confirm Payment</h1>
            <p>
              Review your order details and confirm your payment.
            </p>
          </div>

          <PawPrint aria-hidden="true" />
        </header>

        {loading ? (
          <section className="sandbox-payment-card sandbox-payment-loading">
            <Clock size={38} />
            <p>Loading payment details...</p>
          </section>
        ) : error && !payment ? (
          <section className="sandbox-payment-card sandbox-payment-result">
            <XCircle size={52} />
            <h2>Unable to load payment</h2>
            <p role="alert">{error}</p>
            <Link to="/customer/orders">View My Orders</Link>
          </section>
        ) : payment ? (
          <section className="sandbox-payment-card">
            {isPaid ? (
              <div className="sandbox-payment-result sandbox-payment-success">
                <CheckCircle size={58} />
                <h2>Payment successful!</h2>
                <p>Your payment has been confirmed.</p>
              </div>
            ) : isFailed ? (
              <div className="sandbox-payment-result sandbox-payment-failure">
                <XCircle size={58} />
                <h2>Payment failed</h2>
                <p>
                  Your payment could not be completed.
                  Your order has not been paid.
                </p>
              </div>
            ) : (
              <div className="sandbox-payment-result sandbox-payment-waiting">
                <Clock size={58} />
                <h2>Payment awaiting confirmation</h2>
                <p>
                  Confirm your payment to complete your order.
                </p>
              </div>
            )}

            <div className="sandbox-payment-details">
              <div>
                <span>Order reference</span>
                <strong>#{payment.order}</strong>
              </div>

              <div>
                <span>Payment reference</span>
                <strong>{reference}</strong>
              </div>

              <div>
                <span>Payment method</span>
                <strong>{getMethodLabel(payment.method)}</strong>
              </div>

              <div>
                <span>Amount</span>
                <strong>
                  {formatAmount(payment.amount, payment.currency)}
                </strong>
              </div>

              <div>
                <span>Payment status</span>
                <strong className="sandbox-payment-status">
                  {payment.status.replaceAll("_", " ")}
                </strong>
              </div>
            </div>

            {error && (
              <div className="sandbox-payment-error" role="alert">
                {error}
              </div>
            )}

            {cartRefreshError && (
              <div className="sandbox-payment-error" role="alert">
                {cartRefreshError}
              </div>
            )}

            {isPending && (
              <div className="sandbox-payment-actions">
                <p>
                  Confirm your payment to proceed with your order.
                </p>

                <button
                  type="button"
                  className="sandbox-payment-success-button"
                  disabled={processing}
                  onClick={() => handleSimulation("success")}
                >
                  <CheckCircle size={19} />
                  {processing ? "Confirming..." : "Confirm Payment"}
                </button>

                {/* Retained for future payment failure testing.

                <button
                  type="button"
                  className="sandbox-payment-failure-button"
                  disabled={processing}
                  onClick={() => handleSimulation("failed")}
                >
                  <XCircle size={19} />
                  {processing ? "Processing..." : "Simulate Failed Payment"}
                </button>

                */}
              </div>
            )}

            {isPaid && (
              <Link
                to="/customer/orders"
                className="sandbox-payment-primary-link"
              >
                View My Orders
              </Link>
            )}

            {isFailed && (
              <Link
                to="/customer/orders"
                className="sandbox-payment-primary-link"
              >
                View My Orders
              </Link>
            )}
          </section>
        ) : (
          <section className="sandbox-payment-card sandbox-payment-result">
            <XCircle size={52} />
            <h2>Payment not found</h2>
            <p>We could not find a payment for this order.</p>
            <Link to="/customer/orders">View My Orders</Link>
          </section>
        )}

        <Link to="/customer/cart" className="sandbox-payment-back-link">
          <Smartphone size={16} />
          Return to Cart
        </Link>
      </main>
    </div>
  );
}


import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  PawPrint,
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

export default function SandboxPaymentPage() {
  const [searchParams] = useSearchParams();
  const { refreshCart } = useCart();

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

  // Load the payment belonging to this order.
  useEffect(() => {
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
  }, [reference, validOrderId, orderId, refreshCart]);

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

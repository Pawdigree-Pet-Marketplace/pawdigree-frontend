import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  MapPin,
  PackageCheck,
  PawPrint,
  Phone,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import { useCart, type CartItem } from "../../context/CartContext";

import "./CustomerReceiptPage.css";

type DeliveryInformation = {
  shipping_name: string;
  shipping_phone: string;
  shipping_city_district: string;
  shipping_address: string;
  notes?: string;
  district?: string;
  city?: string;
};

type ReceiptLocationState = {
  paymentDemonstration: true;
  paymentMethod: "mobile_money" | "airtel_money" | "card";
  deliveryInformation: DeliveryInformation;
};

const demoReference = "DEMO-ORDER-ONLY";

function isDeliveryInformation(value: unknown): value is DeliveryInformation {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.shipping_name === "string" &&
    typeof record.shipping_phone === "string" &&
    typeof record.shipping_city_district === "string" &&
    typeof record.shipping_address === "string" &&
    (record.notes === undefined || typeof record.notes === "string") &&
    (record.district === undefined || typeof record.district === "string") &&
    (record.city === undefined || typeof record.city === "string")
  );
}

function isReceiptLocationState(value: unknown): value is ReceiptLocationState {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    record.paymentDemonstration === true &&
    (record.paymentMethod === "mobile_money" ||
      record.paymentMethod === "airtel_money" ||
      record.paymentMethod === "card") &&
    isDeliveryInformation(record.deliveryInformation)
  );
}

function formatPrice(price: string | number) {
  const amount = Number(price);
  return Number.isFinite(amount)
    ? `UGX ${amount.toLocaleString("en-UG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : `UGX ${price}`;
}

function formatSubtotal(items: CartItem[]) {
  return formatPrice(
    items.reduce((total, item) => total + Number(item.line_total), 0),
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("en-UG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function paymentMethodLabel(method: ReceiptLocationState["paymentMethod"]) {
  switch (method) {
    case "mobile_money":
      return "Mobile Money";
    case "airtel_money":
      return "Airtel Money";
    case "card":
      return "Credit / Debit Card";
  }
}

function ReceiptItemRow({
  item,
  isPet,
}: {
  item: CartItem;
  isPet: boolean;
}) {
  return (
    <article
      className={`customer-receipt-item-row${
        isPet ? " is-pet" : " is-merchandise"
      }`}
    >
      <div className="customer-receipt-thumbnail">
        <div className="customer-receipt-thumbnail-placeholder" aria-hidden="true">
          {isPet ? <PawPrint size={21} /> : <ShoppingBag size={21} />}
        </div>
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            onError={(event) => event.currentTarget.remove()}
          />
        )}
      </div>

      <div className="customer-receipt-item-info">
        <h3>{item.name}</h3>
        <p>{item.business_name}</p>
        <span>{isPet ? "Pet · Quantity 1" : "Merchandise"}</span>
      </div>

      {isPet ? (
        <div className="customer-receipt-item-price">
          <span>Price</span>
          <strong>{formatPrice(item.unit_price)}</strong>
        </div>
      ) : (
        <>
          <div className="customer-receipt-item-quantity">
            <span>Quantity</span>
            <strong>{item.quantity}</strong>
          </div>
          <div className="customer-receipt-item-price">
            <span>Unit price</span>
            <strong>{formatPrice(item.unit_price)}</strong>
          </div>
          <div className="customer-receipt-item-price customer-receipt-line-total">
            <span>Line subtotal</span>
            <strong>{formatPrice(item.line_total)}</strong>
          </div>
        </>
      )}
    </article>
  );
}

export default function CustomerReceiptPage() {
  const location = useLocation();
  const [demoOrderDate] = useState(() => new Date());
  const { cartItems, cartCount, cartTotal, loading, error } = useCart();
  const receiptState = isReceiptLocationState(location.state)
    ? location.state
    : null;

  const petItems = cartItems.filter((item) => item.item_type === "pet");
  const merchandiseItems = cartItems.filter(
    (item) => item.item_type !== "pet",
  );
  const cartUnavailable = Boolean(error && !loading && cartItems.length === 0);
  const itemCountLabel = loading
    ? "Loading items..."
    : `${cartCount} ${cartCount === 1 ? "item" : "items"}`;
  const displaySubtotal = (items: CartItem[]) =>
    loading
      ? "Loading..."
      : cartUnavailable
        ? "Unavailable"
        : formatSubtotal(items);
  const displayTotal = loading
    ? "Loading..."
    : cartUnavailable
      ? "Unavailable"
      : formatPrice(cartTotal);

  const locationParts =
    receiptState?.deliveryInformation.shipping_city_district
      .split(",")
      .map((part) => part.trim()) ?? [];
  const district =
    receiptState?.deliveryInformation.district?.trim() ||
    locationParts[0] ||
    "Not provided";
  const city =
    receiptState?.deliveryInformation.city?.trim() ||
    locationParts.slice(1).join(", ") ||
    "Not provided";

  return (
    <div className="customer-receipt-layout">
      <CustomerDashboardNav />

      <main className="customer-receipt-main">
        <header className="customer-receipt-hero">
          <div className="customer-receipt-hero-copy">
            <p className="customer-receipt-eyebrow">PAWDIGREE PET STORE</p>
            <h1>Order Confirmation</h1>
            <p>
              Thank you for shopping with Pawdigree. Your order details are
              below.
            </p>
          </div>
          <div className="customer-receipt-hero-art" aria-hidden="true">
            <CheckCircle2 className="customer-receipt-hero-check" />
            <PawPrint className="customer-receipt-hero-paw" />
            <Sparkles className="customer-receipt-hero-sparkle" />
          </div>
        </header>

        {error && (
          <div className="customer-receipt-alert" role="alert">
            {error}
          </div>
        )}

        {!receiptState ? (
          <section className="customer-receipt-unavailable">
            <ClipboardList size={38} aria-hidden="true" />
            <h2>Demo confirmation data is unavailable</h2>
            <p>
              Start from Checkout and continue through the Payment preview to
              view your delivery information and order summary here.
            </p>
            <Link to="/customer/checkout" className="customer-receipt-primary">
              Return to Checkout <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <>
            <div className="customer-receipt-demo-notice" role="note">
              <span className="customer-receipt-demo-mark" aria-hidden="true">
                DEMO
              </span>
              <p>
                Frontend demonstration only. No order was submitted and no
                payment was processed or verified.
              </p>
            </div>

            <section
              className="customer-receipt-panel customer-receipt-order-info"
              aria-labelledby="customer-receipt-order-heading"
            >
              <div className="customer-receipt-section-heading">
                <ClipboardList size={21} aria-hidden="true" />
                <div>
                  <h2 id="customer-receipt-order-heading">Order Information</h2>
                  <p>These details are part of your frontend demo.</p>
                </div>
              </div>

              <dl className="customer-receipt-info-grid">
                <div>
                  <dt>Order Number / Reference</dt>
                  <dd>{demoReference}</dd>
                  <small>Demo reference · not backend-generated</small>
                </div>
                <div>
                  <dt>
                    <CalendarDays size={15} aria-hidden="true" />
                    Order Date
                  </dt>
                  <dd>{formatDate(demoOrderDate)}</dd>
                </div>
                <div>
                  <dt>
                    <PackageCheck size={15} aria-hidden="true" />
                    Order Status
                  </dt>
                  <dd>
                    <span className="customer-receipt-status">
                      Demo only · not submitted
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>
                    <CreditCard size={15} aria-hidden="true" />
                    Payment Method
                  </dt>
                  <dd>{paymentMethodLabel(receiptState.paymentMethod)}</dd>
                </div>
                <div>
                  <dt>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    Payment Status
                  </dt>
                  <dd>Not processed</dd>
                </div>
              </dl>
            </section>

            <div className="customer-receipt-content">
              <div className="customer-receipt-main-column">
                <section
                  className="customer-receipt-panel customer-receipt-items"
                  aria-labelledby="customer-receipt-items-heading"
                >
                  <div className="customer-receipt-section-heading">
                    <ShoppingBag size={21} aria-hidden="true" />
                    <div>
                      <h2 id="customer-receipt-items-heading">
                        Items in this demo checkout
                      </h2>
                      <p>{itemCountLabel}</p>
                    </div>
                  </div>

                  {loading ? (
                    <p className="customer-receipt-message" aria-live="polite">
                      Loading cart items...
                    </p>
                  ) : cartItems.length === 0 ? (
                    <p className="customer-receipt-message">
                      No items are currently available in the cart snapshot.
                    </p>
                  ) : (
                    <>
                      {petItems.length > 0 && (
                        <section
                          className="customer-receipt-category"
                          aria-labelledby="customer-receipt-pets-heading"
                        >
                          <h3 id="customer-receipt-pets-heading">Pet Sales</h3>
                          <div className="customer-receipt-item-list">
                            {petItems.map((item) => (
                              <ReceiptItemRow
                                key={item.id}
                                item={item}
                                isPet
                              />
                            ))}
                          </div>
                        </section>
                      )}

                      {merchandiseItems.length > 0 && (
                        <section
                          className="customer-receipt-category"
                          aria-labelledby="customer-receipt-merch-heading"
                        >
                          <h3 id="customer-receipt-merch-heading">
                            Merchandise
                          </h3>
                          <div className="customer-receipt-item-list">
                            {merchandiseItems.map((item) => (
                              <ReceiptItemRow
                                key={item.id}
                                item={item}
                                isPet={false}
                              />
                            ))}
                          </div>
                        </section>
                      )}
                    </>
                  )}
                </section>

                <section
                  className="customer-receipt-panel"
                  aria-labelledby="customer-receipt-delivery-heading"
                >
                  <div className="customer-receipt-section-heading">
                    <MapPin size={21} aria-hidden="true" />
                    <div>
                      <h2 id="customer-receipt-delivery-heading">
                        Delivery Information
                      </h2>
                      <p>Information provided during Checkout.</p>
                    </div>
                  </div>

                  <dl className="customer-receipt-delivery-grid">
                    <div>
                      <dt>
                        <UserRound size={15} aria-hidden="true" />
                        Customer Name
                      </dt>
                      <dd>{receiptState.deliveryInformation.shipping_name}</dd>
                    </div>
                    <div>
                      <dt>
                        <Phone size={15} aria-hidden="true" />
                        Phone Number
                      </dt>
                      <dd>{receiptState.deliveryInformation.shipping_phone}</dd>
                    </div>
                    <div>
                      <dt>District</dt>
                      <dd>{district}</dd>
                    </div>
                    <div>
                      <dt>City / Town</dt>
                      <dd>{city}</dd>
                    </div>
                    <div className="customer-receipt-address">
                      <dt>
                        <MapPin size={15} aria-hidden="true" />
                        Delivery Address
                      </dt>
                      <dd>
                        {receiptState.deliveryInformation.shipping_address}
                      </dd>
                    </div>
                    <div className="customer-receipt-address">
                      <dt>Additional Delivery Instructions</dt>
                      <dd>
                        {receiptState.deliveryInformation.notes?.trim() ||
                          "None provided"}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <aside
                className="customer-receipt-panel customer-receipt-summary"
                aria-labelledby="customer-receipt-summary-heading"
              >
                <h2 id="customer-receipt-summary-heading">Order Summary</h2>
                <p className="customer-receipt-count">
                  {itemCountLabel}
                </p>
                <div className="customer-receipt-summary-row">
                  <span>Pet Sales Subtotal</span>
                  <strong>{displaySubtotal(petItems)}</strong>
                </div>
                <div className="customer-receipt-summary-row">
                  <span>Merchandise Subtotal</span>
                  <strong>{displaySubtotal(merchandiseItems)}</strong>
                </div>
                <div className="customer-receipt-summary-row">
                  <span>Delivery Fee</span>
                  <strong>Calculated separately</strong>
                </div>
                <div className="customer-receipt-total">
                  <span>Total Amount</span>
                  <strong>{displayTotal}</strong>
                </div>
                <p className="customer-receipt-summary-note">
                  Total reflects item charges. Delivery fee, if applicable, is
                  calculated separately.
                </p>
              </aside>
            </div>

            <nav className="customer-receipt-actions" aria-label="Order actions">
              <Link
                to="/customer/tracking"
                state={{
                  paymentDemonstration: true,
                  demoReference,
                  paymentMethod: receiptState.paymentMethod,
                  deliveryInformation: receiptState.deliveryInformation,
                }}
                className="customer-receipt-primary"
              >
                Track My Order <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                to="/merchandise"
                className="customer-receipt-secondary"
              >
                <ShoppingBag size={17} aria-hidden="true" />
                Continue Shopping
              </Link>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}

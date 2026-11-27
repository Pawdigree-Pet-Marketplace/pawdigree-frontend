import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Clock3,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  PawPrint,
  Phone,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import { useCart, type CartItem } from "../../context/CartContext";

import "./CustomerDeliveryTrackingPage.css";

type DeliveryInformation = {
  shipping_name: string;
  shipping_phone: string;
  shipping_city_district: string;
  shipping_address: string;
  notes?: string;
  district?: string;
  city?: string;
};

type TrackingLocationState = {
  paymentDemonstration: true;
  demoReference: string;
  paymentMethod: "mobile_money" | "airtel_money" | "card";
  deliveryInformation: DeliveryInformation;
};

const deliveryStages = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
] as const;

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

function isTrackingLocationState(value: unknown): value is TrackingLocationState {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    record.paymentDemonstration === true &&
    typeof record.demoReference === "string" &&
    record.demoReference.trim().length > 0 &&
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

function TrackingItemRow({
  item,
  isPet,
}: {
  item: CartItem;
  isPet: boolean;
}) {
  return (
    <article
      className={`customer-tracking-item-row${
        isPet ? " is-pet" : " is-merchandise"
      }`}
    >
      <div className="customer-tracking-thumbnail">
        <div
          className="customer-tracking-thumbnail-placeholder"
          aria-hidden="true"
        >
          {isPet ? <PawPrint size={20} /> : <ShoppingBag size={20} />}
        </div>
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            onError={(event) => event.currentTarget.remove()}
          />
        )}
      </div>
      <div className="customer-tracking-item-info">
        <h4>{item.name}</h4>
        <p>{item.business_name}</p>
        <span>
          {isPet
            ? "Pet · Quantity 1"
            : `Merchandise · Qty ${item.quantity} · ${formatPrice(item.unit_price)} each`}
        </span>
      </div>
      <div className="customer-tracking-item-price">
        <span>{isPet ? "Price" : "Line subtotal"}</span>
        <strong>{formatPrice(item.line_total)}</strong>
      </div>
    </article>
  );
}

export default function CustomerDeliveryTrackingPage() {
  const location = useLocation();
  const { cartItems, cartCount, cartTotal, loading, error } = useCart();
  const trackingState = isTrackingLocationState(location.state)
    ? location.state
    : null;
  const currentStageIndex = 1;

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

  const deliveryInformation = trackingState?.deliveryInformation;
  const locationParts =
    deliveryInformation?.shipping_city_district
      .split(",")
      .map((part) => part.trim()) ?? [];
  const district =
    deliveryInformation?.district?.trim() || locationParts[0] || "Unavailable";
  const city =
    deliveryInformation?.city?.trim() ||
    locationParts.slice(1).join(", ") ||
    "Unavailable";

  return (
    <div className="customer-tracking-layout">
      <CustomerDashboardNav />

      <main className="customer-tracking-main">
        <header className="customer-tracking-hero">
          <div className="customer-tracking-hero-copy">
            <p className="customer-tracking-eyebrow">PAWDIGREE PET STORE</p>
            <h1>Track Your Order</h1>
            <p>
              Stay updated on your Pawdigree order from confirmation to
              delivery.
            </p>
          </div>
          <div className="customer-tracking-hero-art" aria-hidden="true">
            <Truck className="customer-tracking-hero-truck" />
            <PawPrint className="customer-tracking-hero-paw" />
            <Sparkles className="customer-tracking-hero-sparkle" />
          </div>
        </header>

        {error && (
          <div className="customer-tracking-alert" role="alert">
            {error}
          </div>
        )}

        <div className="customer-tracking-demo-notice" role="note">
          <span className="customer-tracking-demo-mark" aria-hidden="true">
            DEMO
          </span>
          <p>
            This is a frontend tracking demonstration. No live courier or
            backend delivery updates are connected.
          </p>
        </div>

        {!trackingState && (
          <div className="customer-tracking-alert" role="status">
            Order confirmation details were not passed to this page. You can
            still view the demonstration timeline, but order and delivery
            information is unavailable.
          </div>
        )}

        <section
          className="customer-tracking-panel customer-tracking-progress"
          aria-labelledby="customer-tracking-progress-heading"
        >
          <div className="customer-tracking-section-heading">
            <PackageCheck size={21} aria-hidden="true" />
            <div>
              <h2 id="customer-tracking-progress-heading">
                Delivery Progress
              </h2>
              <p>
                Order reference:{" "}
                <strong>
                  {trackingState?.demoReference ?? "Not available"}
                </strong>
              </p>
            </div>
            <span className="customer-tracking-current-badge">
              Demonstration status
            </span>
          </div>

          <ol className="customer-tracking-timeline">
            {deliveryStages.map((stage, index) => {
              const isCurrent = index === currentStageIndex;
              const isComplete = index < currentStageIndex;

              return (
                <li
                  key={stage}
                  className={`customer-tracking-stage${
                    isComplete
                      ? " is-complete"
                      : isCurrent
                        ? " is-current"
                        : " is-upcoming"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span className="customer-tracking-stage-marker">
                    {isComplete ? (
                      <Check size={15} aria-hidden="true" />
                    ) : isCurrent ? (
                      <span aria-hidden="true">{index + 1}</span>
                    ) : (
                      <Circle size={14} aria-hidden="true" />
                    )}
                  </span>
                  <span className="customer-tracking-stage-label">{stage}</span>
                  {isCurrent && (
                    <span className="customer-tracking-stage-status">
                      Current demo stage
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="customer-tracking-no-dates">
            No dates or times are shown because no live delivery timestamps are
            available.
          </p>
        </section>

        <div className="customer-tracking-content">
          <div className="customer-tracking-main-column">
            <section
                className="customer-tracking-panel"
              aria-labelledby="customer-tracking-delivery-heading"
            >
              <div className="customer-tracking-section-heading">
                <MapPin size={21} aria-hidden="true" />
                <div>
                  <h2 id="customer-tracking-delivery-heading">
                    Delivery Information
                  </h2>
                  <p>Details submitted during Checkout.</p>
                </div>
              </div>
              <dl className="customer-tracking-delivery-grid">
                <div>
                  <dt>
                    <UserRound size={15} aria-hidden="true" />
                    Customer Name
                  </dt>
                  <dd>{deliveryInformation?.shipping_name ?? "Unavailable"}</dd>
                </div>
                <div>
                  <dt>
                    <Phone size={15} aria-hidden="true" />
                    Delivery Phone
                  </dt>
                  <dd>{deliveryInformation?.shipping_phone ?? "Unavailable"}</dd>
                </div>
                <div>
                  <dt>District</dt>
                  <dd>{district}</dd>
                </div>
                <div>
                  <dt>City / Town</dt>
                  <dd>{city}</dd>
                </div>
                <div className="customer-tracking-address">
                  <dt>
                    <MapPin size={15} aria-hidden="true" />
                    Delivery Address
                  </dt>
                  <dd>
                    {deliveryInformation?.shipping_address ?? "Unavailable"}
                  </dd>
                </div>
                <div className="customer-tracking-address">
                  <dt>Delivery Instructions</dt>
                  <dd>
                    {deliveryInformation?.notes?.trim() || "None provided"}
                  </dd>
                </div>
              </dl>
            </section>

            <section
                className="customer-tracking-panel"
              aria-labelledby="customer-tracking-updates-heading"
            >
              <div className="customer-tracking-section-heading">
                <Clock3 size={21} aria-hidden="true" />
                <div>
                  <h2 id="customer-tracking-updates-heading">
                    Delivery Updates
                  </h2>
                  <p>Demonstration status · not a courier update</p>
                </div>
              </div>
              <article className="customer-tracking-update">
                <span className="customer-tracking-update-icon" aria-hidden="true">
                  <PackageCheck size={17} />
                </span>
                <div>
                  <strong>{deliveryStages[currentStageIndex]}</strong>
                  <p>
                    Demonstration placeholder for the current stage. No
                    delivery event or timestamp has been received.
                  </p>
                </div>
                <span className="customer-tracking-update-tag">Demo</span>
              </article>
            </section>
          </div>

          <aside
            className="customer-tracking-panel customer-tracking-summary"
            aria-labelledby="customer-tracking-summary-heading"
          >
            <h2 id="customer-tracking-summary-heading">Order Summary</h2>
            <p className="customer-tracking-count">{itemCountLabel}</p>

            {loading ? (
              <p className="customer-tracking-summary-message">
                Loading cart items...
              </p>
            ) : !trackingState ? (
              <p className="customer-tracking-summary-message">
                Order items are unavailable without confirmation data.
              </p>
            ) : cartItems.length === 0 ? (
              <p className="customer-tracking-summary-message">
                No items are currently available in the cart snapshot.
              </p>
            ) : (
              <div className="customer-tracking-items">
                {petItems.length > 0 && (
                  <section aria-label="Pet Sales items">
                    <h3>Pet Sales</h3>
                    {petItems.map((item) => (
                      <TrackingItemRow
                        key={item.id}
                        item={item}
                        isPet
                      />
                    ))}
                  </section>
                )}
                {merchandiseItems.length > 0 && (
                  <section aria-label="Merchandise items">
                    <h3>Merchandise</h3>
                    {merchandiseItems.map((item) => (
                      <TrackingItemRow
                        key={item.id}
                        item={item}
                        isPet={false}
                      />
                    ))}
                  </section>
                )}
              </div>
            )}

            <div className="customer-tracking-summary-row">
              <span>Pet Sales Subtotal</span>
              <strong>
                {trackingState ? displaySubtotal(petItems) : "Unavailable"}
              </strong>
            </div>
            <div className="customer-tracking-summary-row">
              <span>Merchandise Subtotal</span>
              <strong>
                {trackingState
                  ? displaySubtotal(merchandiseItems)
                  : "Unavailable"}
              </strong>
            </div>
            <div className="customer-tracking-summary-row">
              <span>Delivery Fee</span>
              <strong>Calculated separately</strong>
            </div>
            <div className="customer-tracking-total">
              <span>Total Amount</span>
              <strong>
                {trackingState ? displayTotal : "Unavailable"}
              </strong>
            </div>
            <p className="customer-tracking-summary-note">
              Item prices come from the current CartContext snapshot. Delivery
              fees, if applicable, are calculated separately.
            </p>
          </aside>
        </div>

        <nav className="customer-tracking-actions" aria-label="Tracking actions">
          {trackingState && (
            <Link
              to="/customer/receipt"
              state={trackingState}
              className="customer-tracking-secondary"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Back to Order Confirmation
            </Link>
          )}
          <Link
            to="/merchandise"
            className="customer-tracking-secondary"
          >
            <ShoppingBag size={17} aria-hidden="true" />
            Continue Shopping
          </Link>
          <Link
            to="/customer/dashboard"
            className="customer-tracking-primary"
          >
            <LayoutDashboard size={17} aria-hidden="true" />
            Customer Dashboard
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </nav>
      </main>
    </div>
  );
}

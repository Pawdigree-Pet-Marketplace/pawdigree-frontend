import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  PawPrint,
  Sparkles,
} from "lucide-react";
import useSession from "../../hooks/useSession";
import { useCart, type CartItem } from "../../context/CartContext";
import "./CustomerCartPage.css";

export default function CustomerCartPage() {
  const navigate = useNavigate();
  const isCustomer = useSession("CUSTOMER");

  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    hasUnavailableItems,
    loading,
    error,
  } = useCart();

  const petItems = cartItems.filter((item) => item.item_type === "pet");
  const merchandiseItems = cartItems.filter(
    (item) => item.item_type !== "pet"
  );

  // The backend supplies money as strings; line totals are only summed to
  // provide the requested per-category subtotals.
  const formatPrice = (price: string | number) =>
    `UGX ${Number(price).toLocaleString("en-UG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatSubtotal = (items: CartItem[]) => {
    const total = items.reduce(
      (sum, item) => sum + Number(item.line_total),
      0
    );
    return formatPrice(total);
  };

  const renderCartItem = (item: CartItem) => {
    const isPet = item.item_type === "pet";

    return (
      <article className="customer-cart-item" key={item.id}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="customer-cart-item-image"
          />
        ) : (
          <div
            className="customer-cart-item-placeholder"
            aria-hidden="true"
          >
            {isPet ? <PawPrint size={22} /> : <ShoppingBag size={22} />}
          </div>
        )}

        <div className="customer-cart-item-details">
          <div className="customer-cart-item-heading">
            <h3>{item.name}</h3>
            <span className="customer-cart-item-type">
              {isPet ? "Pet" : "Merchandise"}
            </span>
          </div>
          <div className="customer-cart-item-meta">
            <p className="customer-cart-business">{item.business_name}</p>
            <p
              className={`customer-cart-availability ${
                item.available ? "is-available" : "is-unavailable"
              }`}
            >
              <span aria-hidden="true" />
              {item.available ? "Available" : "Unavailable"}
            </p>
          </div>
          {!item.available && (
            <p className="customer-cart-item-issue" role="alert">
              {item.issue || "This item is currently unavailable."}
            </p>
          )}
        </div>

        <div className="customer-cart-item-unit-price">
          <span>{isPet ? "Price" : "Unit price"}</span>
          <strong>{formatPrice(item.unit_price)}</strong>
        </div>

        <div className="customer-cart-item-quantity">
          {isPet ? (
            <>
              <span className="customer-cart-field-label">Quantity</span>
              <span className="customer-cart-pet-quantity">1</span>
            </>
          ) : (
            <>
              <span className="customer-cart-field-label">Quantity</span>
              <div className="customer-cart-quantity">
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${item.name}`}
                  disabled={item.quantity <= 1 || !item.available}
                  onClick={() =>
                    void updateQuantity(
                      item.id,
                      item.quantity - 1
                    ).catch(() => {})
                  }
                >
                  <Minus size={15} />
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${item.name}`}
                  disabled={
                    !item.available || item.quantity >= item.max_quantity
                  }
                  onClick={() =>
                    void updateQuantity(
                      item.id,
                      item.quantity + 1
                    ).catch(() => {})
                  }
                >
                  <Plus size={15} />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="customer-cart-item-subtotal">
          <span>Line subtotal</span>
          <strong>{formatPrice(item.line_total)}</strong>
        </div>

        <button
          type="button"
          className="customer-cart-remove"
          aria-label={`Remove ${item.name} from cart`}
          onClick={() => void removeFromCart(item.id).catch(() => {})}
        >
          <Trash2 size={16} />
          <span>Remove</span>
        </button>
      </article>
    );
  };

  return (
    <div className="customer-cart-layout">
      <main className="customer-cart-main">
        <header className="customer-cart-heading">
          <div className="customer-cart-heading-content">
            <p className="customer-cart-eyebrow">PAWDIGREE PET STORE</p>
            <h1>My Shopping Cart</h1>
            <p>Review your selected merchandise and pets before checkout.</p>
          </div>

          <div className="customer-cart-decoration" aria-hidden="true">
            <Sparkles className="cart-sparkle" />
            <PawPrint className="cart-paw cart-paw-one" />
            <PawPrint className="cart-paw cart-paw-two" />
          </div>
        </header>

        {error && (
          <p className="customer-cart-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <section className="customer-cart-empty" aria-live="polite">
            <p>Loading your cart...</p>
          </section>
        ) : cartItems.length === 0 ? (
          <section className="customer-cart-empty">
            <ShoppingBag size={48} aria-hidden="true" />
            <h2>Your cart is empty</h2>
            <p>You haven&apos;t added any items yet.</p>
            <Link to="/merchandise" className="customer-cart-shop-link">
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </section>
        ) : (
          <div className="customer-cart-content">
            <div className="customer-cart-items">
              {petItems.length > 0 && (
                <section
                  className="customer-cart-category"
                  aria-labelledby="customer-cart-pets-heading"
                >
                  <div className="customer-cart-items-heading">
                    <div>
                      <h2 id="customer-cart-pets-heading">Pet Sales</h2>
                      <p>
                        {petItems.length}{" "}
                        {petItems.length === 1 ? "pet" : "pets"}
                      </p>
                    </div>
                  </div>
                  <div className="customer-cart-items-list">
                    {petItems.map(renderCartItem)}
                  </div>
                  <div className="customer-cart-category-total">
                    <span>Pet Sales Subtotal</span>
                    <strong>{formatSubtotal(petItems)}</strong>
                  </div>
                </section>
              )}

              {merchandiseItems.length > 0 && (
                <section
                  className="customer-cart-category"
                  aria-labelledby="customer-cart-merchandise-heading"
                >
                  <div className="customer-cart-items-heading">
                    <div>
                      <h2 id="customer-cart-merchandise-heading">
                        Merchandise
                      </h2>
                      <p>
                        {merchandiseItems.length}{" "}
                        {merchandiseItems.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                  <div className="customer-cart-items-list">
                    {merchandiseItems.map(renderCartItem)}
                  </div>
                  <div className="customer-cart-category-total">
                    <span>Merchandise Subtotal</span>
                    <strong>{formatSubtotal(merchandiseItems)}</strong>
                  </div>
                </section>
              )}

              <div className="customer-cart-actions">
                <button
                  type="button"
                  className="customer-cart-clear-button"
                  onClick={() => void clearCart().catch(() => {})}
                >
                  <Trash2 size={16} />
                  Clear Cart
                </button>
                <Link
                  to="/merchandise"
                  className="customer-cart-continue-link"
                >
                  <ArrowLeft size={16} />
                  Continue Shopping
                </Link>
              </div>
            </div>

            <aside className="customer-cart-summary">
              <h2>Order Summary</h2>
              <div className="customer-cart-summary-row">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="customer-cart-summary-row">
                <span>Pet Sales Subtotal</span>
                <span>{formatSubtotal(petItems)}</span>
              </div>
              <div className="customer-cart-summary-row">
                <span>Merchandise Subtotal</span>
                <span>{formatSubtotal(merchandiseItems)}</span>
              </div>
              <div className="customer-cart-summary-total">
                <span>Combined Cart Total</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              {hasUnavailableItems && (
                <p className="customer-cart-item-issue" role="alert">
                  Your cart contains unavailable items. Please review them
                  before proceeding.
                </p>
              )}

              <p className="customer-cart-delivery-note">
                Delivery fees, if applicable, will be calculated separately.
              </p>

              {isCustomer ? (
                <button
                  type="button"
                  className="customer-cart-button"
                  disabled={loading || hasUnavailableItems}
                  onClick={() => navigate("/customer/checkout")}
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="customer-cart-guest-checkout">
                  <p>
                    Please log in or create an account to proceed to checkout.
                  </p>

                  <Link
                    to="/login"
                    state={{ from: { pathname: "/customer/checkout" } }}
                    className="customer-cart-button"
                  >
                    Log In to Checkout
                  </Link>
                  <Link
                    to="/registration"
                    state={{ from: { pathname: "/customer/checkout" } }}
                    className="customer-cart-register-link"
                  >
                    Create an Account
                  </Link>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

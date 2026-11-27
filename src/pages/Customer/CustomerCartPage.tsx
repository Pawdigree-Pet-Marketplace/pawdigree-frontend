
import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  PawPrint,
  Sparkles,
} from "lucide-react";
import useSession from "../../hooks/useSession";
import { useCart } from "../../context/CartContext";
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

  // The backend supplies money as strings.
  // Display the supplied values without recalculating or converting them.
  const formatPrice = (price: string) => `UGX ${price}`;

  return (
    <div className="customer-cart-layout">
      <main className="customer-cart-main">
        {/* PAGE HEADING */}
        <header className="customer-cart-heading">
          <div className="customer-cart-heading-content">
            <p className="customer-cart-eyebrow">
              PAWDIGREE PET STORE
            </p>

            <h1>My Shopping Cart</h1>

            <p>
              Review your selected merchandise and pets before checkout.
            </p>
          </div>

          <div
            className="customer-cart-decoration"
            aria-hidden="true"
          >
            <Sparkles className="cart-sparkle" />
            <PawPrint className="cart-paw cart-paw-one" />
            <PawPrint className="cart-paw cart-paw-two" />
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <p className="customer-cart-error" role="alert">
            {error}
          </p>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <section className="customer-cart-empty">
            <p>Loading your cart...</p>
          </section>
        ) : cartItems.length === 0 ? (
          /* EMPTY CART STATE */
          <section className="customer-cart-empty">
            <ShoppingBag size={52} />

            <h2>Your cart is empty</h2>

            <p>You haven't added any items yet.</p>

            <Link to="/" className="customer-cart-shop-link">
              Explore Pawdigree
            </Link>
          </section>
        ) : (
          /* CART CONTENT */
          <div className="customer-cart-content">
            {/* CART ITEMS */}
            <section className="customer-cart-items">
              <div className="customer-cart-items-heading">
                <div>
                  <h2>Cart Items</h2>
                  <p>{cartCount} items selected</p>
                </div>

                <button
                  type="button"
                  className="customer-cart-clear-button"
                  onClick={() => void clearCart().catch(() => {})}
                >
                  Clear Cart
                </button>
              </div>

              <div className="customer-cart-items-grid">
                {cartItems.map((item) => {
                  const isPet = item.item_type === "pet";

                  return (
                    <article
                      className="customer-cart-item"
                      key={item.id}
                    >
                      {/* ITEM IMAGE */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="customer-cart-item-image"
                        />
                      ) : (
                        <div className="customer-cart-item-placeholder">
                          {isPet ? (
                            <PawPrint size={38} />
                          ) : (
                            <ShoppingBag size={38} />
                          )}
                        </div>
                      )}

                      {/* ITEM INFORMATION */}
                      <div className="customer-cart-item-details">
                        <span className="customer-cart-item-type">
                          {isPet ? "Pet for Sale" : "Merchandise"}
                        </span>

                        <h3>{item.name}</h3>

                        <p className="customer-cart-business">
                          {item.business_name}
                        </p>

                        <p className="customer-cart-unit-price">
                          {formatPrice(item.unit_price)}
                        </p>

                        {!item.available && (
                          <p
                            className="customer-cart-item-issue"
                            role="alert"
                          >
                            {item.issue ||
                              "This item is currently unavailable."}
                          </p>
                        )}
                      </div>

                      {/* QUANTITY AND SUBTOTAL */}
                      <div className="customer-cart-item-bottom">
                        {!isPet && (
                          <div className="customer-cart-quantity">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              disabled={
                                item.quantity <= 1 || !item.available
                              }
                              onClick={() =>
                                void updateQuantity(
                                  item.id,
                                  item.quantity - 1
                                ).catch(() => {})
                              }
                            >
                              <Minus size={15} />
                            </button>

                            <span aria-live="polite">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              disabled={
                                !item.available ||
                                item.quantity >= item.max_quantity
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
                        )}

                        {isPet && (
                          <span className="customer-cart-pet-quantity">
                            One pet
                          </span>
                        )}

                        <div className="customer-cart-item-price">
                          <span>Subtotal</span>
                          <strong>
                            {formatPrice(item.line_total)}
                          </strong>
                        </div>
                      </div>

                      {/* REMOVE ITEM */}
                      <button
                        type="button"
                        className="customer-cart-remove"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() =>
                          void removeFromCart(item.id).catch(() => {})
                        }
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <aside className="customer-cart-summary">
              <h2>Order Summary</h2>

              <div className="customer-cart-summary-row">
                <span>Items ({cartCount})</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>

              <div className="customer-cart-summary-total">
                <span>Total</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              {hasUnavailableItems && (
                <p className="customer-cart-item-issue" role="alert">
                  Your cart contains unavailable items. Please review
                  them before proceeding.
                </p>
              )}

              <p className="customer-cart-delivery-note">
                Delivery fees, if applicable, will be calculated
                separately.
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
                    Please log in or create an account to proceed
                    to checkout.
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

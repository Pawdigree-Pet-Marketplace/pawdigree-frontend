
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import { useCart } from "../../context/CartContext";
import "./CustomerCartPage.css";

export default function CustomerCartPage() {
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
  // We display those values without recalculating or converting them.
  const formatPrice = (price: string) => `UGX ${price}`;

  return (
    <div className="customer-cart-layout">
      <CustomerDashboardNav />

      <main className="customer-cart-main">
        <header className="customer-cart-heading">
          <p className="customer-cart-eyebrow">PET STORE</p>
          <h1>My Shopping Cart</h1>
          <p>Review your selected merchandise before checkout.</p>
        </header>

        {error && (
          <p className="customer-cart-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <section className="customer-cart-empty">
            <p>Loading your cart...</p>
          </section>
        ) : cartItems.length === 0 ? (
          <section className="customer-cart-empty">
            <ShoppingBag size={52} />
            <h2>Your cart is empty</h2>
            <p>You haven't added any merchandise yet.</p>
            <Link to="/" className="customer-cart-shop-link">
              Explore Pawdigree
            </Link>
          </section>
        ) : (
          <div className="customer-cart-content">
            <section className="customer-cart-items">
              <div className="customer-cart-items-heading">
                <h2>Cart Items ({cartCount})</h2>

                <button
                  type="button"
                  onClick={() => void clearCart().catch(() => {})}
                >
                  Clear Cart
                </button>
              </div>

              {cartItems.map((item) => (
                <article className="customer-cart-item" key={item.id}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="customer-cart-item-image"
                    />
                  ) : (
                    <div className="customer-cart-item-placeholder">
                      <ShoppingBag size={30} />
                    </div>
                  )}

                  <div className="customer-cart-item-details">
                    <h3>{item.name}</h3>
                    <p>{formatPrice(item.unit_price)}</p>

                    <div className="customer-cart-quantity">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={item.quantity <= 1}
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

                    {!item.available && (
                      <p className="customer-cart-item-issue" role="alert">
                        {item.issue || "This item is currently unavailable."}
                      </p>
                    )}
                  </div>

                  <div className="customer-cart-item-actions">
                    <strong>{formatPrice(item.line_total)}</strong>

                    <button
                      type="button"
                      className="customer-cart-remove"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() =>
                        void removeFromCart(item.id).catch(() => {})
                      }
                    >
                      <Trash2 size={18} />
                      <span>Remove</span>
                    </button>
                  </div>
                </article>
              ))}
            </section>

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
                  Your cart contains unavailable items. Please review them
                  before proceeding.
                </p>
              )}

              <p>
                Delivery fees, if applicable, will be calculated separately.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

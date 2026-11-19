
import { ShoppingCart, Check, CheckCircle, X } from "lucide-react";
import { useState } from "react";
import { useCart, type CartProduct } from "../../context/CartContext";
import "./AddToCartButton.css";

type AddToCartButtonProps = {
  product: CartProduct;
  disabled?: boolean;
};

export default function AddToCartButton({
  product,
  disabled = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();

  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleAddToCart() {
    if (disabled || loading) return;

    setLoading(true);
    setAdded(false);
    setError(null);
    setSuccessMessage("");

    try {
      await addToCart(product);

      setAdded(true);
      setSuccessMessage(`${product.name} added to cart successfully!`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add this product.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {successMessage && (
        <div
          className="add-to-cart-success-toast"
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={21} aria-hidden="true" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <button
        type="button"
        className={`add-to-cart-button ${added ? "added" : ""}`}
        onClick={() => void handleAddToCart()}
        disabled={disabled || loading}
        aria-label={
          added
            ? `${product.name} added to cart`
            : `Add ${product.name} to cart`
        }
      >
        {added ? <Check size={18} /> : <ShoppingCart size={18} />}
        <span>
          {disabled
            ? "Unavailable"
            : loading
              ? "Adding..."
              : added
                ? "Added to Cart"
                : "Add to Cart"}
        </span>
      </button>

      {error && (
        <p role="alert" className="add-to-cart-error">
          {error}
        </p>
      )}
    </div>
  );
}

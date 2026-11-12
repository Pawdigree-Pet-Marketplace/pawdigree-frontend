
import { ShoppingCart, Check } from "lucide-react";
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

  async function handleAddToCart() {
    if (disabled || loading) return;

    setLoading(true);
    setAdded(false);
    setError(null);

    try {
      await addToCart(product);
      setAdded(true);
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
      <button
        type="button"
        className={`add-to-cart-button ${added ? "added" : ""}`}
        onClick={handleAddToCart}
        disabled={disabled || loading}
        aria-label={`Add ${product.name} to cart`}
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

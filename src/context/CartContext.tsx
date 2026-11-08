
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  addCartItem,
  emptyCart,
  getCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItemQuantity,
  type CartItem,
} from "../services/cart/cartApi";

import {
  AUTH_SESSION_CHANGE_EVENT,
  getSessionRole,
} from "../services/auth/authStorage";

// Keep this type for components that pass product information to the cart.
export type CartProduct = {
  id: number | string;
  name: string;
  price?: number;
  image?: string;
};

// Make the backend cart item type available to other components.
export type { CartItem };

// Actions available to components using the cart.
type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: CartProduct) => Promise<void>;
  updateQuantity: (id: number | string, quantity: number) => Promise<void>;
  removeFromCart: (id: number | string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: string;
  hasUnavailableItems: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
};

// Create the context.
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider makes cart data available throughout the application.
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState("0.00");
  const [hasUnavailableItems, setHasUnavailableItems] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replace the displayed cart with the complete response from the backend.
  const updateCartState = useCallback((cart: {
    items: CartItem[];
    total_quantity: number;
    total: string;
    has_unavailable_items: boolean;
  }) => {
    setCartItems(cart.items);
    setCartCount(cart.total_quantity);
    setCartTotal(cart.total);
    setHasUnavailableItems(cart.has_unavailable_items);
  }, []);

  // Load the cart, merging a guest cart first when a customer logs in.
  const syncCart = useCallback(async () => {
    const role = getSessionRole();

    // Vendors must not access the customer shopping cart.
    if (role === "VENDOR") {
      setCartItems([]);
      setCartCount(0);
      setCartTotal("0.00");
      setHasUnavailableItems(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cart =
        role === "CUSTOMER"
          ? (await mergeGuestCart()) ?? (await getCart())
          : await getCart();

      updateCartState(cart);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your cart."
      );
    } finally {
      setLoading(false);
    }
  }, [updateCartState]);

  // Load the cart when the application starts.
  // Also respond when a user logs in or their session changes.
  useEffect(() => {
    // Schedule the initial load outside the synchronous effect execution.
    const initialLoad = window.setTimeout(() => {
      void syncCart();
    }, 0);

    function handleAuthChange() {
      void syncCart();
    }

    window.addEventListener(
      AUTH_SESSION_CHANGE_EVENT,
      handleAuthChange
    );

    return () => {
      window.clearTimeout(initialLoad);

      window.removeEventListener(
        AUTH_SESSION_CHANGE_EVENT,
        handleAuthChange
      );
    };
  }, [syncCart]);

  // Add a product using its backend product ID.
  async function addToCart(product: CartProduct) {
    setError(null);

    try {
      const cart = await addCartItem({
        product: product.id,
        quantity: 1,
      });

      updateCartState(cart);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not add this product.";

      setError(message);
      throw err;
    }
  }

  // Update the quantity using the backend cart-line ID.
  async function updateQuantity(id: number | string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) return;

    setError(null);

    try {
      const cart = await updateCartItemQuantity(id, quantity);
      updateCartState(cart);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update the quantity.";

      setError(message);
      throw err;
    }
  }

  // Remove one cart line.
  async function removeFromCart(id: number | string) {
    setError(null);

    try {
      const cart = await removeCartItem(id);
      updateCartState(cart);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not remove this item.";

      setError(message);
      throw err;
    }
  }

  // Empty the entire cart.
  async function clearCart() {
    setError(null);

    try {
      const cart = await emptyCart();
      updateCartState(cart);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not clear your cart.";

      setError(message);
      throw err;
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        hasUnavailableItems,
        loading,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook for accessing cart functionality.
 // eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}

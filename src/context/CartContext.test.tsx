import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "./CartContext";
import { saveAuthSession } from "../services/auth/authStorage";

const { getCartMock, mergeGuestCartMock, addCartItemMock, emptyCartMock, removeCartItemMock, updateCartItemQuantityMock } = vi.hoisted(() => ({
  getCartMock: vi.fn(), mergeGuestCartMock: vi.fn(), addCartItemMock: vi.fn(), emptyCartMock: vi.fn(),
  removeCartItemMock: vi.fn(), updateCartItemQuantityMock: vi.fn(),
}));

vi.mock("../services/cart/cartApi", () => ({
  getCart: getCartMock, mergeGuestCart: mergeGuestCartMock, addCartItem: addCartItemMock,
  emptyCart: emptyCartMock, removeCartItem: removeCartItemMock,
  updateCartItemQuantity: updateCartItemQuantityMock,
}));

function CartSnapshot() {
  const { cartItems, loading, error } = useCart();
  return <div>
    <p>{loading ? "Loading cart" : "Cart ready"}</p>
    {cartItems.map((item) => <p key={item.id}>{item.name}</p>)}
    {error && <p role="alert">{error}</p>}
  </div>;
}

const cart = (name: string) => ({
  items: [{
    id: 1, item_type: "product" as const, product_id: 1, pet_id: null, name, business_name: "Paw Shop",
    image: null, unit_price: "10000", quantity: 1, line_total: "10000", available: true, issue: null, max_quantity: 5,
  }],
  total_quantity: 1, total: "10000", has_unavailable_items: false, cart_token: null,
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("CartProvider authentication synchronization", () => {
  it("merges a guest cart after login and renders the merged cart response", async () => {
    localStorage.setItem("pawdigree:cart_token", "guest-token");
    getCartMock.mockResolvedValue(cart("Guest item"));
    mergeGuestCartMock.mockImplementation(async () => {
      expect(localStorage.getItem("pawdigree:cart_token")).toBe("guest-token");
      localStorage.removeItem("pawdigree:cart_token");
      return cart("Merged item");
    });

    render(<CartProvider><CartSnapshot /></CartProvider>);
    expect(await screen.findByText("Guest item")).toBeInTheDocument();
    saveAuthSession({ access: "customer-token", refresh: "refresh-token", role: "CUSTOMER" });

    expect(await screen.findByText("Merged item")).toBeInTheDocument();
    expect(screen.queryByText("Guest item")).not.toBeInTheDocument();
    expect(mergeGuestCartMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("pawdigree:cart_token")).toBeNull();
  });

  it("replaces stale guest state with the authenticated cart if merging fails", async () => {
    localStorage.setItem("pawdigree:cart_token", "guest-token");
    getCartMock.mockResolvedValueOnce(cart("Guest item")).mockResolvedValueOnce(cart("Account item"));
    mergeGuestCartMock.mockRejectedValue(new Error("Merge failed"));

    render(<CartProvider><CartSnapshot /></CartProvider>);
    expect(await screen.findByText("Guest item")).toBeInTheDocument();
    saveAuthSession({ access: "customer-token", refresh: "refresh-token", role: "CUSTOMER" });

    expect(await screen.findByText("Account item")).toBeInTheDocument();
    expect(screen.queryByText("Guest item")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Merge failed"));
  });
});

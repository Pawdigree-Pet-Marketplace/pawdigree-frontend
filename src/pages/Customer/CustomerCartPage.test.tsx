import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import CustomerCartPage from "./CustomerCartPage";

vi.mock("../../hooks/useSession", () => ({ default: () => false }));
vi.mock("../../context/CartContext", () => ({
  useCart: () => ({
    cartItems: [{
      id: 1, item_type: "product", product_id: 1, pet_id: null, name: "Travel Bowl",
      business_name: "Paw Shop", image: null, unit_price: "10000", quantity: 1,
      line_total: "10000", available: true, issue: null, max_quantity: 5,
    }],
    updateQuantity: vi.fn(), removeFromCart: vi.fn(), clearCart: vi.fn(),
    cartCount: 1, cartTotal: "10000", hasUnavailableItems: false, loading: false, error: null,
  }),
}));

function DestinationProbe() {
  const location = useLocation();
  return <output data-testid="login-state">{JSON.stringify(location.state)}</output>;
}

afterEach(() => vi.clearAllMocks());

describe("anonymous cart checkout links", () => {
  it("preserves checkout as the destination for both login and registration", () => {
    render(
      <MemoryRouter initialEntries={["/customer/cart"]}>
        <Routes>
          <Route path="/customer/cart" element={<CustomerCartPage />} />
          <Route path="/login" element={<DestinationProbe />} />
          <Route path="/registration" element={<DestinationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Log In to Checkout" }));
    expect(screen.getByTestId("login-state")).toHaveTextContent('"pathname":"/customer/checkout"');
  });
});

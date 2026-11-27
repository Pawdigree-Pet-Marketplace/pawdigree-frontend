import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import CustomerReceiptPage from "./CustomerReceiptPage";
import CustomerDeliveryTrackingPage from "./CustomerDeliveryTrackingPage";
import { useCart, type CartItem } from "../../context/CartContext";

vi.mock("../../context/CartContext", () => ({
  useCart: vi.fn(),
}));

vi.mock(
  "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav",
  () => ({
    default: () => <nav aria-label="Customer navigation" />,
  }),
);

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    item_type: "pet",
    product_id: null,
    pet_id: 7,
    name: "Milo",
    business_name: "Paw Haven",
    image: null,
    unit_price: "120000.00",
    quantity: 1,
    line_total: "120000.00",
    available: true,
    issue: null,
    max_quantity: 1,
    ...overrides,
  };
}

const receiptState = {
  paymentDemonstration: true,
  paymentMethod: "airtel_money",
  deliveryInformation: {
    shipping_name: "Alex Customer",
    shipping_phone: "+256700000000",
    shipping_city_district: "Wakiso, Entebbe",
    shipping_address: "12 Market Road",
    notes: "Call on arrival",
    district: "Wakiso",
    city: "Entebbe",
  },
};

function renderReceipt(state: unknown = receiptState) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/customer/receipt",
          state,
        },
      ]}
    >
      <Routes>
        <Route path="/customer/receipt" element={<CustomerReceiptPage />} />
        <Route
          path="/customer/tracking"
          element={<CustomerDeliveryTrackingPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(useCart).mockReturnValue({
    cartItems: [
      makeCartItem(),
      makeCartItem({
        id: 2,
        item_type: "product",
        product_id: 15,
        pet_id: null,
        name: "Travel Bowl",
        business_name: "Paw Supplies",
        unit_price: "12500.00",
        quantity: 2,
        line_total: "25000.00",
        max_quantity: 10,
      }),
    ],
    addToCart: vi.fn(),
    addPetToCart: vi.fn(),
    updateQuantity: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn(),
    cartCount: 3,
    cartTotal: "145000.00",
    hasUnavailableItems: false,
    loading: false,
    error: null,
    clearError: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CustomerReceiptPage", () => {
  it("renders a demo receipt with separated items, totals, and delivery details", () => {
    renderReceipt();

    expect(
      screen.getByRole("heading", { name: "Order Confirmation" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Frontend demonstration only. No order was submitted and no payment was processed or verified.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("DEMO-ORDER-ONLY")).toBeTruthy();
    expect(screen.getByText("Airtel Money")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Pet Sales" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Merchandise" })).toBeTruthy();
    expect(screen.getByText("Milo")).toBeTruthy();
    expect(screen.getByText("Travel Bowl")).toBeTruthy();
    expect(screen.getAllByText("UGX 120,000.00")).toHaveLength(2);
    expect(screen.getAllByText("UGX 25,000.00")).toHaveLength(2);
    expect(screen.getByText("UGX 145,000.00")).toBeTruthy();
    expect(screen.getByText("Alex Customer")).toBeTruthy();
    expect(screen.getByText("Wakiso")).toBeTruthy();
    expect(screen.getByText("Entebbe")).toBeTruthy();
    expect(screen.getByText("Not processed")).toBeTruthy();

    expect(
      screen.getByRole("link", { name: /Continue Shopping/ }).getAttribute("href"),
    ).toBe("/merchandise");
  });

  it("prepares tracking navigation and handles missing receipt state", () => {
    renderReceipt();

    fireEvent.click(screen.getByRole("link", { name: /Track My Order/ }));
    expect(
      screen.getByRole("heading", { name: "Track Your Order" }),
    ).toBeTruthy();
    expect(screen.getByText("DEMO-ORDER-ONLY")).toBeTruthy();

    cleanup();
    renderReceipt(null);
    expect(
      screen.getByRole("heading", {
        name: "Demo confirmation data is unavailable",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Return to Checkout/ }).getAttribute("href"),
    ).toBe("/customer/checkout");
  });
});

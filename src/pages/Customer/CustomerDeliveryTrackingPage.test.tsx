import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import CustomerDeliveryTrackingPage from "./CustomerDeliveryTrackingPage";
import CustomerReceiptPage from "./CustomerReceiptPage";
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

const trackingState = {
  paymentDemonstration: true,
  demoReference: "DEMO-ORDER-ONLY",
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

function renderTracking(state: unknown = trackingState) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/customer/tracking",
          state,
        },
      ]}
    >
      <Routes>
        <Route
          path="/customer/tracking"
          element={<CustomerDeliveryTrackingPage />}
        />
        <Route path="/customer/receipt" element={<CustomerReceiptPage />} />
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

describe("CustomerDeliveryTrackingPage", () => {
  it("shows all delivery stages, delivery details, and demo item totals", () => {
    const { container } = renderTracking();

    expect(
      screen.getByRole("heading", { name: "Track Your Order" }),
    ).toBeTruthy();
    expect(
      screen.getByText(/No live courier or backend delivery updates are connected/),
    ).toBeTruthy();
    expect(screen.getByText("DEMO-ORDER-ONLY")).toBeTruthy();

    for (const stage of [
      "Order Placed",
      "Confirmed",
      "Processing",
      "Dispatched",
      "Out for Delivery",
      "Delivered",
    ]) {
      expect(screen.getAllByText(stage).length).toBeGreaterThan(0);
    }

    expect(
      container.querySelector(
        '.customer-tracking-stage[aria-current="step"]',
      )?.textContent,
    ).toContain("Confirmed");
    expect(
      container.querySelector(
        ".customer-tracking-stage.is-complete svg",
      ),
    ).toBeTruthy();

    expect(screen.getByText("Alex Customer")).toBeTruthy();
    expect(screen.getByText("+256700000000")).toBeTruthy();
    expect(screen.getByText("Wakiso")).toBeTruthy();
    expect(screen.getByText("Entebbe")).toBeTruthy();
    expect(screen.getByText("12 Market Road")).toBeTruthy();
    expect(screen.getByText("Call on arrival")).toBeTruthy();
    expect(screen.getAllByText("UGX 120,000.00")).toHaveLength(2);
    expect(screen.getAllByText("UGX 25,000.00")).toHaveLength(2);
    expect(screen.getByText("UGX 145,000.00")).toBeTruthy();

    expect(
      screen.getByRole("link", { name: /Continue Shopping/ }).getAttribute("href"),
    ).toBe("/merchandise");
    expect(
      screen.getByRole("link", { name: /Customer Dashboard/ }).getAttribute("href"),
    ).toBe("/customer/dashboard");

    fireEvent.click(
      screen.getByRole("link", { name: /Back to Order Confirmation/ }),
    );
    expect(
      screen.getByRole("heading", { name: "Order Confirmation" }),
    ).toBeTruthy();
  });

  it("shows a clear fallback when no order details were passed", () => {
    renderTracking(null);

    expect(
      screen.getByText(/Order confirmation details were not passed to this page/),
    ).toBeTruthy();
    expect(screen.getByText("Not available")).toBeTruthy();
    expect(
      screen.getByText("Order items are unavailable without confirmation data."),
    ).toBeTruthy();
  });
});

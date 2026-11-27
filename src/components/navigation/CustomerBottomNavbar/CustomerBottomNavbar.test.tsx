import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import BottomNavbar from "./CustomerBottomNavbar";

vi.mock("../../../hooks/useSession", () => ({ default: () => false }));
vi.mock("../../../context/CartContext", () => ({
  useCart: () => ({ cartCount: 2 }),
}));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe("guest mobile cart navigation", () => {
  it("opens the public cart, displays its count, and marks it active", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <CurrentPath />
        <Routes>
          <Route path="/" element={<BottomNavbar />} />
          <Route path="/customer/cart" element={<BottomNavbar />} />
        </Routes>
      </MemoryRouter>,
    );

    const cartButton = screen.getByRole("button", { name: "Cart, 2 items" });
    expect(cartButton).not.toHaveAttribute("aria-current", "page");
    fireEvent.click(cartButton);
    expect(screen.getByTestId("current-path")).toHaveTextContent("/customer/cart");
    expect(screen.getByRole("button", { name: "Cart, 2 items" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("2", { selector: ".nav-cart-badge" })).toBeInTheDocument();
  });
});

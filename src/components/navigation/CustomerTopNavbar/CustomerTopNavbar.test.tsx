import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TopNavbar from "./CustomerTopNavbar";

vi.mock("../../../context/CartContext", () => ({
  useCart: () => ({ cartCount: 3 }),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-state">{JSON.stringify(location.state)}</output>;
}

describe("public customer cart navigation", () => {
  it("links Services directly to the services marketplace page", () => {
    render(
      <MemoryRouter initialEntries={["/vendors"]}>
        <TopNavbar isLoggedIn={false} isMenuOpen={false} setIsMenuOpen={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/services");
  });

  it("shows an accessible cart link with the current count", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopNavbar isLoggedIn={false} isMenuOpen={false} setIsMenuOpen={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Shopping cart, 3 items" })).toHaveAttribute("href", "/customer/cart");
    expect(screen.getByText("3", { selector: ".cart-nav-badge" })).toBeInTheDocument();
  });

  it.each([
    ["/", "top-navbar--glow"],
    ["/pets", "top-navbar--light-background"],
    ["/services", "top-navbar--light-background"],
    ["/vendors", "top-navbar--light-background"],
    ["/customer/cart", "top-navbar--light-background"],
    ["/merchandise", "top-navbar--light-background"],
    ["/explore-pets", "top-navbar--light-background"],
    ["/vendor", "top-navbar--band"],
  ])("uses the shared top-of-page state on %s", (path, expectedPageClass) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <TopNavbar
          isLoggedIn={false}
          audience={path === "/vendor" ? "vendor" : "customer"}
          isMenuOpen={false}
          setIsMenuOpen={vi.fn()}
        />
      </MemoryRouter>,
    );

    const navbar = screen.getByRole("banner");
    expect(navbar).toHaveClass("top-navbar--transparent");
    expect(navbar).not.toHaveClass("top-navbar--scrolled");
    expect(navbar).toHaveClass(expectedPageClass);
  });

  it("keeps the cart link on the merchandise navbar and restores the scroll transition in both directions", async () => {
    render(
      <MemoryRouter initialEntries={["/merchandise"]}>
        <TopNavbar isLoggedIn={false} isMenuOpen={false} setIsMenuOpen={vi.fn()} />
      </MemoryRouter>,
    );

    const navbar = screen.getByRole("banner");
    expect(navbar).toHaveClass("top-navbar--transparent");
    expect(screen.getByRole("link", { name: "Shopping cart, 3 items" })).toHaveAttribute("href", "/customer/cart");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 50 });
    fireEvent.scroll(window);
    await waitFor(() => expect(navbar).toHaveClass("top-navbar--scrolled"));

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    fireEvent.scroll(window);
    await waitFor(() => expect(navbar).toHaveClass("top-navbar--transparent"));
    expect(navbar).not.toHaveClass("top-navbar--scrolled");
  });

  it("preserves the current page for login and keeps authenticated navigation", () => {
    render(
      <MemoryRouter initialEntries={["/customer/cart"]}>
        <LocationProbe />
        <Routes>
          <Route path="/customer/cart" element={<TopNavbar isLoggedIn={false} isMenuOpen={false} setIsMenuOpen={vi.fn()} />} />
          <Route path="/customer-login" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(screen.getAllByTestId("location-state").at(-1)).toHaveTextContent('"pathname":"/customer/cart"');
  });
});

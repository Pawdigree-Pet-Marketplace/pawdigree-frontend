import { render as rtlRender, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import LandingPage from "./CustomerLandingPage";

function CurrentPath() {
  const location = useLocation();
  return <p data-testid="current-path">{location.pathname}</p>;
}

function renderLandingPage() {
  return rtlRender(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<><LandingPage /><CurrentPath /></>} />
        <Route path="/customer/dashboard" element={<p>Customer dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("LandingPage", () => {
  it("renders the main landing page content", () => {
    renderLandingPage();

    expect(
      screen.getByRole("heading", {
        name: /find your next pet from verified sellers near you/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("searchbox", {
        name: /search pets, breeds, or locations/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", {
        name: /create account/i,
      }),
    ).toHaveLength(1);

    expect(screen.getByTestId("current-path")).toHaveTextContent("/");
  });

  it("returns an authenticated customer to the dashboard when the landing page is reached", async () => {
    localStorage.setItem("token", "customer-token");
    localStorage.setItem("refresh", "customer-refresh");
    localStorage.setItem("role", "CUSTOMER");

    renderLandingPage();

    await waitFor(() => {
      expect(screen.getByText("Customer dashboard")).toBeInTheDocument();
    });
  });
});

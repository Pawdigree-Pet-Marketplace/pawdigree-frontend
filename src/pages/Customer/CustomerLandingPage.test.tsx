import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import LandingPage from "./CustomerLandingPage";

vi.mock("../../services/globalSearchApi", () => ({
  fetchGlobalSuggestions: vi.fn().mockResolvedValue({ suggestions: [] }),
}));

function CurrentPath() {
  const location = useLocation();
  return <p data-testid="current-path">{location.pathname}{location.search}</p>;
}

function renderLandingPage() {
  return rtlRender(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<><LandingPage /><CurrentPath /></>} />
        <Route path="/explore-pets" element={<><h1>Pet results</h1><CurrentPath /></>} />
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
      screen.getByRole("combobox", {
        name: /search pawdigree/i,
      }),
    ).toBeInTheDocument();

    const quickActions = screen.getByRole("navigation", { name: "Quick actions" });
    expect(quickActions).toBeInTheDocument();
    expect(quickActions.querySelectorAll("a")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /meet vendors/i })).toHaveAttribute("href", "/vendors");
    expect(screen.getByRole("link", { name: /^adoption/i })).toHaveAttribute("href", "/explore-pets?listing_type=adoption");
    expect(screen.queryByText(/your next step/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Explore Pawdigree" })).not.toBeInTheDocument();

    expect(
      screen.getAllByRole("link", {
        name: /create account/i,
      }),
    ).toHaveLength(1);

    expect(screen.getByTestId("current-path")).toHaveTextContent("/");
  });

  it("preserves free-text submission to the existing pet search route", () => {
    renderLandingPage();
    const input = screen.getByRole("combobox", { name: /search pawdigree/i });
    fireEvent.change(input, { target: { value: "Ari Havens" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getByRole("heading", { name: "Pet results" })).toBeInTheDocument();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/explore-pets?search=Ari+Havens");
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

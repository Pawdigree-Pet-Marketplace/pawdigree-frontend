import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import CustomerPetCataloguePage from "./CustomerPetCataloguePage";
import { apiRequest } from "../../services/api";

vi.mock("../../services/api", () => ({ apiRequest: vi.fn() }));
vi.mock("../../components/navigation/CustomerDashboardNav/CustomerDashboardNav", () => ({ default: () => <nav>Customer navigation</nav> }));

function RouteSearch() {
  return <output data-testid="route-search">{useLocation().search}</output>;
}

function renderCatalogue() {
  return rtlRender(<MemoryRouter initialEntries={["/pets?search=dog&listing_type=ADOPTION"]}><CustomerPetCataloguePage /><RouteSearch /></MemoryRouter>);
}

describe("Customer pet catalogue", () => {
  afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); vi.clearAllMocks(); });
  it("loads the public listings with URL criteria and keeps filters when applying them", async () => {
    localStorage.setItem("token", "customer-token");
    localStorage.setItem("role", "CUSTOMER");
    vi.mocked(apiRequest).mockResolvedValue({ count: 0, results: [] });
    renderCatalogue();
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("/pets/public/?search=dog&listing_type=ADOPTION"));
    fireEvent.change(screen.getByLabelText("Breed"), { target: { value: "Labrador" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith(expect.stringContaining("search=dog")));
    expect(screen.getByTestId("route-search")).toHaveTextContent("listing_type=ADOPTION");
    expect(screen.getByTestId("route-search")).toHaveTextContent("breed=Labrador");
  });
});

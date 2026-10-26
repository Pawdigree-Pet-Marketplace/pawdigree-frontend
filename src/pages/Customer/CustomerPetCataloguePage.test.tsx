import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPetCataloguePage from "./CustomerPetCataloguePage";
import { apiRequest } from "../../services/api";

vi.mock("../../services/api", () => ({ apiRequest: vi.fn() }));
vi.mock("../../components/navigation/CustomerDashboardNav/CustomerDashboardNav", () => ({ default: () => <nav>Customer navigation</nav> }));

describe("Customer pet catalogue", () => {
  afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); vi.clearAllMocks(); });
  it("loads the public listings with URL criteria and keeps filters when applying them", async () => {
    localStorage.setItem("token", "customer-token");
    localStorage.setItem("role", "CUSTOMER");
    window.history.replaceState(null, "", "/pets?search=dog&listing_type=ADOPTION");
    vi.mocked(apiRequest).mockResolvedValue({ count: 0, results: [] });
    render(<CustomerPetCataloguePage />);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("/pets/public/?search=dog&listing_type=ADOPTION"));
    fireEvent.change(screen.getByLabelText("Breed"), { target: { value: "Labrador" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith(expect.stringContaining("search=dog")));
    expect(window.location.search).toContain("listing_type=ADOPTION");
    expect(window.location.search).toContain("breed=Labrador");
  });
});

import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VendorCataloguePage from "./VendorCataloguePage";
import { VendorBusinessContext } from "../../services/vendorBusinessStore";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";

vi.mock("../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch: vi.fn() }));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ children, title }: { children: ReactNode; title: string }) => <main><h1>{title}</h1>{children}</main>,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("VendorCataloguePage Pet Sales view", () => {
  it("filters the unified pet Catalog to sale listings when type=SALE is selected", async () => {
    localStorage.setItem("token", "vendor-token");
    localStorage.setItem("role", "VENDOR");
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValue(new Response(JSON.stringify([
      { pet_id: 1, name: "Adoption pet", species: "Dog", age: 2, listing_type: "ADOPTION", approved: true, business: "business-42" },
      { pet_id: 2, name: "Sale pet", species: "Cat", age: 1, listing_type: "SALE", price: "250000", approved: true, business: "business-42" },
    ]), { status: 200, headers: { "Content-Type": "application/json" } }));

    render(
      <MemoryRouter initialEntries={["/vendor/business/business-42/listings?type=SALE"]}>
        <VendorBusinessContext.Provider value={{ business: { id: "business-42", name: "Paws", business_type: "PET_SALE_ADOPTION" } }}>
          <VendorCataloguePage />
        </VendorBusinessContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Sale pet" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Adoption pet" })).not.toBeInTheDocument();
    expect(screen.getByText("Showing pets listed for sale.")).toBeInTheDocument();
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith("http://api.test/api/pets/?business_id=business-42");
  });
});

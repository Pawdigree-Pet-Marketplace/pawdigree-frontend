import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VendorBusinessDashboardPage from "./VendorBusinessDashboardPage";
import { VendorBusinessContext } from "../../services/vendorBusinessStore";

vi.mock("../../services/api", () => ({ apiRequest: vi.fn().mockResolvedValue({ first_name: "Faith" }) }));
vi.mock("../../components/BusinessVerificationStatus/BusinessVerificationStatus", () => ({ default: () => null }));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ children, title }: { children: React.ReactNode; title: string }) => <main><h1>{title}</h1>{children}</main>,
}));

function renderBusinessDashboard(business_type: string) {
  localStorage.setItem("token", "vendor-token");
  localStorage.setItem("role", "VENDOR");
  render(
    <MemoryRouter>
      <VendorBusinessContext.Provider value={{ business: { id: "business-42", name: "Selected business", business_type } }}>
        <VendorBusinessDashboardPage />
      </VendorBusinessContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe("VendorBusinessDashboardPage", () => {
  it("shows orders without bookings in the merchandise dashboard", () => {
    renderBusinessDashboard("PRODUCT_SELLER");
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.queryByText("Pending Bookings")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RECENT ORDERS" })).toBeInTheDocument();
  });

  it("shows Pet Sales and Adoption Applications without Orders or Bookings", () => {
    renderBusinessDashboard("PET_SALE_ADOPTION");
    expect(screen.getByText("Pet Sales")).toBeInTheDocument();
    expect(screen.getByText("Adoption Applications")).toBeInTheDocument();
    expect(screen.queryByText("Orders")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Bookings")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "RECENT ORDERS & BOOKINGS" })).not.toBeInTheDocument();
  });

  it("shows services and bookings without Orders in the services dashboard", () => {
    renderBusinessDashboard("SERVICE_PROVIDER");
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.queryByText("Orders")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RECENT BOOKINGS" })).toBeInTheDocument();
  });
});

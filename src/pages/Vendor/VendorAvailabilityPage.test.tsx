import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorAvailabilityPage from "./VendorAvailabilityPage";
import { VendorBusinessContext } from "../../services/vendorBusinessStore";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";

vi.mock("../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch: vi.fn() }));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ children, title }: { children: ReactNode; title: string }) => <main><h1>{title}</h1>{children}</main>,
}));
vi.mock("../../components/BackButton/BackButton", () => ({
  default: ({ fallback, label }: { fallback: string; label: string }) => <a href={fallback}>{label}</a>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("VendorAvailabilityPage business context", () => {
  it.each(["PET_SALE_ADOPTION", "PRODUCT_SELLER"])("redirects %s businesses away from Availability without fetching services", async (business_type) => {
    const business = { id: "business-42", name: "Selected business", business_type };
    render(
      <MemoryRouter initialEntries={["/vendor/business/business-42/availability"]}>
        <VendorBusinessContext.Provider value={{ business }}>
          <Routes>
            <Route path="/vendor/business/:businessId/availability" element={<VendorAvailabilityPage />} />
            <Route path="/vendor/business/:businessId/dashboard" element={<p>Selected business dashboard</p>} />
          </Routes>
        </VendorBusinessContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Selected business dashboard")).toBeInTheDocument();
    expect(vendorAuthenticatedFetch).not.toHaveBeenCalled();
  });

  it("filters services and keeps availability actions inside the selected business", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValue(new Response(JSON.stringify([
      { service_id: 11, name: "Current business grooming", business: "business-42", price: "30000", duration: 60 },
      { service_id: 12, name: "Other business grooming", business: "business-99", price: "25000", duration: 45 },
    ]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const business = {
      id: "business-42",
      name: "Pawdigree Services",
      business_type: "SERVICE_PROVIDER",
    };

    render(
      <MemoryRouter initialEntries={["/vendor/business/business-42/availability"]}>
        <VendorBusinessContext.Provider value={{ business }}>
          <VendorAvailabilityPage />
        </VendorBusinessContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Current business grooming")).toBeInTheDocument();
    expect(screen.queryByText("Other business grooming")).not.toBeInTheDocument();
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith("http://api.test/api/services/?business_id=business-42");
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/vendor/business/business-42/dashboard");
    expect(screen.getByRole("link", { name: /manage availability/i })).toHaveAttribute(
      "href",
      "/vendor/business/business-42/services/11/availability",
    );
  });

  it("uses the existing service data for Catalog and links to the current edit route", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValue(new Response(JSON.stringify([
      { service_id: 11, name: "Current business grooming", business: "business-42", price: "30000", duration: 60 },
    ]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const business = {
      id: "business-42",
      name: "Pawdigree Services",
      business_type: "SERVICE_PROVIDER",
    };

    render(
      <MemoryRouter initialEntries={["/vendor/business/business-42/services"]}>
        <VendorBusinessContext.Provider value={{ business }}>
          <VendorAvailabilityPage view="catalog" />
        </VendorBusinessContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Current business grooming")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Service Catalog" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit service/i })).toHaveAttribute(
      "href",
      "/vendor/business/business-42/services/11/edit",
    );
    expect(screen.getByRole("link", { name: /manage availability/i })).toHaveAttribute(
      "href",
      "/vendor/business/business-42/services/11/availability",
    );
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith("http://api.test/api/services/?business_id=business-42");
  });

  it("shows review status and availability as separate service states", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValue(new Response(JSON.stringify([
      { service_id: 21, name: "Awaiting review", business: "business-42", approved: false, rejection_reason: "", availability_status: "available" },
      { service_id: 22, name: "Accepted but unavailable", business: "business-42", approved: true, rejection_reason: "", availability_status: "unavailable" },
      { service_id: 23, name: "Needs correction", business: "business-42", approved: false, rejection_reason: "Please use a clearer service name.", availability_status: "available" },
    ]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const business = { id: "business-42", name: "Pawdigree Services", business_type: "SERVICE_PROVIDER" };
    render(<MemoryRouter><VendorBusinessContext.Provider value={{ business }}><VendorAvailabilityPage view="catalog" /></VendorBusinessContext.Provider></MemoryRouter>);

    expect(await screen.findByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText(/Please use a clearer service name\./)).toBeInTheDocument();
    expect(screen.queryByText(/category approval pending/i)).not.toBeInTheDocument();
  });
});

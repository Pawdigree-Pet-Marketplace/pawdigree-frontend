import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
});

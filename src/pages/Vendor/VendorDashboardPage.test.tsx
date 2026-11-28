import { cleanup, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../../services/api";
import {
  fetchVendorDashboardBookings,
  fetchVendorDashboardOrders,
  fetchVendorDashboardPetSales,
} from "../../services/vendorDashboardApi";
import VendorDashboardPage from "./VendorDashboardPage";

const vendorBusinessState = vi.hoisted(() => ({ businesses: [] as Array<{ id: string; name: string; business_type: string; verification_status: string }>, loading: false, error: "" }));

vi.mock("../../services/vendorBusinessStore", () => ({
  useVendorBusiness: () => null,
  useVendorBusinesses: () => vendorBusinessState,
}));
vi.mock("../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/api")>();
  return { ...actual, apiRequest: vi.fn() };
});
vi.mock("../../services/vendorDashboardApi", () => ({
  fetchVendorDashboardBookings: vi.fn(),
  fetchVendorDashboardOrders: vi.fn(),
  fetchVendorDashboardPetSales: vi.fn(),
}));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
}));

const page = (results: unknown[] = [], count = results.length) => ({ results, count, next: null });
const render = () => rtlRender(<MemoryRouter><VendorDashboardPage /></MemoryRouter>);

describe("VendorDashboardPage", () => {
  beforeEach(() => {
    vendorBusinessState.businesses = [];
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("token", "vendor-token");
    localStorage.setItem("role", "VENDOR");
    vi.mocked(apiRequest).mockResolvedValue({ first_name: "Faith", id: 2 });
    vi.mocked(fetchVendorDashboardOrders).mockResolvedValue(page([
      { id: 1, order_id: 101, customer: { name: "Amina" }, business_name: "Paws Shop", created_at: "2026-11-28T10:00:00Z", status: "PAID" },
    ], 3) as never);
    vi.mocked(fetchVendorDashboardPetSales).mockResolvedValue(page([
      { id: 2, order_id: 102, customer: { name: "Noah" }, business_name: "Puppy House", created_at: "2026-11-28T11:00:00Z", status: "PROCESSING", sale_state: "PAID" },
    ], 2) as never);
    vi.mocked(fetchVendorDashboardBookings).mockImplementation(async (status) => page(
      status === "pending" ? [] : [{ booking_id: 7, customer: { name: "Joan" }, business_name: "Happy Tails", service_name: "Grooming", start_at: "2026-11-29T09:30:00Z", created_at: "2026-11-28T10:00:00Z", status: "pending" }],
      status === "pending" ? 4 : 1,
    ) as never);
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("greets the vendor and loads vendor-wide order, pet sale and booking activity", async () => {
    render();
    expect(await screen.findByRole("heading", { name: "Welcome back, Faith" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("5", { selector: "strong" })).toBeInTheDocument());
    expect(screen.getByText("Amina")).toBeInTheDocument();
    expect(screen.getByText("Noah")).toBeInTheDocument();
    expect(screen.getByText("Paws Shop")).toBeInTheDocument();
    expect(screen.getByText("Puppy House")).toBeInTheDocument();
    expect(screen.getByText("Joan")).toBeInTheDocument();
    expect(screen.getByText("Happy Tails")).toBeInTheDocument();
    expect(fetchVendorDashboardBookings).toHaveBeenCalledWith("pending");
    expect(fetchVendorDashboardPetSales).toHaveBeenCalledWith("PAID");
  });

  it("does not present unsupported financial figures as real values", () => {
    render();
    expect(screen.getByText("Total Sales")).toBeInTheDocument();
    expect(screen.getByText("Revenue (Net)")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/current APIs do not expose a complete vendor sales total/i)).toBeInTheDocument();
  });

  it("shows activity errors and empty states honestly", async () => {
    vi.mocked(fetchVendorDashboardOrders).mockRejectedValue(new Error("offline"));
    vi.mocked(fetchVendorDashboardPetSales).mockRejectedValue(new Error("offline"));
    vi.mocked(fetchVendorDashboardBookings).mockRejectedValue(new Error("offline"));
    render();
    expect(await screen.findByText("Orders could not be loaded. Please try again later.")).toBeInTheDocument();
    expect(screen.getByText("Bookings could not be loaded. Please try again later.")).toBeInTheDocument();
  });

  it("does not render without a vendor session", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    const { container } = render();
    expect(container).toBeEmptyDOMElement();
  });
});

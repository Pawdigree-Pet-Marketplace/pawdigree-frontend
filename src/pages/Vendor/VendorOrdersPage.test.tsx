import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import VendorOrdersPage from "./VendorOrdersPage";
import { fetchVendorOrders } from "../../services/vendorOrdersApi";
import { fetchVendorBookings, updateVendorBookingStatus } from "../../services/bookings/vendorBookingApi";

const state = vi.hoisted(() => ({ activeBusiness: null as null | { id: string; name: string; business_type: string }, businesses: [] as { id: string; name: string; business_type: string }[] }));

vi.mock("../../services/vendorBusinessStore", () => ({
  useVendorBusiness: () => state.activeBusiness,
  useVendorBusinesses: () => ({ businesses: state.businesses, loading: false, error: "" }),
}));
vi.mock("../../services/vendorOrdersApi", () => ({ fetchVendorOrders: vi.fn(), updateVendorOrderStatus: vi.fn() }));
vi.mock("../../services/bookings/vendorBookingApi", () => ({ fetchVendorBookings: vi.fn(), updateVendorBookingStatus: vi.fn() }));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
}));

const order = (id: number, businessName: string, itemType: "product" | "pet") => ({
  id,
  order_id: id + 100,
  business_name: businessName,
  status: "PAID" as const,
  shipping_name: "Customer",
  shipping_phone: "0700000000",
  shipping_address: "Kampala",
  shipping_city_district: "Central",
  notes: "",
  items: [{ id, item_type: itemType, quantity: itemType === "pet" ? null : 1, name: `Item ${id}` }],
  total: "50000",
  created_at: "2026-11-25T09:00:00Z",
  updated_at: "2026-11-25T09:00:00Z",
});

const booking = {
  booking_id: 77,
  customer_id: 9,
  customer_name: "Sam Customer",
  service_name: "Full grooming",
  start_at: "2026-12-01T09:00:00Z",
  end_at: "2026-12-01T10:00:00Z",
  status: "pending" as const,
  notes: "Please be gentle.",
  decision_reason: null,
  created_at: "2026-11-25T09:00:00Z",
};

afterEach(() => {
  cleanup();
  state.activeBusiness = null;
  state.businesses = [];
  vi.clearAllMocks();
});

describe("vendor business order and booking views", () => {
  it("limits a merchandise business to its own product orders", async () => {
    state.activeBusiness = { id: "store-1", name: "Jolly Treats", business_type: "PRODUCT_SELLER" };
    state.businesses = [state.activeBusiness];
    vi.mocked(fetchVendorOrders).mockResolvedValue([order(1, "Jolly Treats", "product"), order(2, "Pet House", "pet")]);
    render(<VendorOrdersPage />);

    expect(await screen.findByText("Order #101")).toBeInTheDocument();
    expect(screen.queryByText("Order #102")).not.toBeInTheDocument();
    expect(fetchVendorBookings).not.toHaveBeenCalled();
  });

  it("shows only pet-sale orders while leaving adoption in its separate workflow", async () => {
    state.activeBusiness = { id: "pets-1", name: "Pet House", business_type: "PET_SALE_ADOPTION" };
    state.businesses = [state.activeBusiness];
    vi.mocked(fetchVendorOrders).mockResolvedValue([order(1, "Jolly Treats", "product"), order(2, "Pet House", "pet")]);
    render(<VendorOrdersPage />);

    expect(await screen.findByText("Order #102")).toBeInTheDocument();
    expect(screen.queryByText("Order #101")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pet sale orders" })).toBeInTheDocument();
    expect(fetchVendorBookings).not.toHaveBeenCalled();
  });

  it("shows and updates bookings for a vendor with one service business", async () => {
    state.activeBusiness = { id: "service-1", name: "Paws Clinic", business_type: "SERVICE_PROVIDER" };
    state.businesses = [state.activeBusiness];
    vi.mocked(fetchVendorBookings).mockResolvedValue([booking]);
    vi.mocked(updateVendorBookingStatus).mockResolvedValue({ ...booking, status: "accepted" });
    render(<VendorOrdersPage />);

    expect(await screen.findByText("Full grooming")).toBeInTheDocument();
    expect(screen.getByText("Sam Customer")).toBeInTheDocument();
    expect(screen.getByText("Please be gentle.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept booking" }));
    expect(await screen.findByText("Booking #77 accepted.")).toBeInTheDocument();
    expect(updateVendorBookingStatus).toHaveBeenCalledWith(77, "accepted", undefined);
    expect(fetchVendorOrders).not.toHaveBeenCalled();
  });

  it("hides bookings when multiple service businesses cannot be distinguished by the API", () => {
    state.activeBusiness = { id: "service-1", name: "Paws Clinic", business_type: "SERVICE_PROVIDER" };
    state.businesses = [state.activeBusiness, { id: "service-2", name: "Happy Groomers", business_type: "SERVICE_PROVIDER" }];
    render(<VendorOrdersPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(/booking API does not include a business or service ID/i);
    expect(fetchVendorBookings).not.toHaveBeenCalled();
  });
});

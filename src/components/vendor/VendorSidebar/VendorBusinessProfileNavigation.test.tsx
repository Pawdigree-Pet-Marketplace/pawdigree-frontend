import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorLayout from "../../../layouts/VendorLayout/VendorLayout";
import VendorSidebar from "./VendorSidebar";
import VendorProfilePage from "../../../pages/Vendor/VendorProfilePage";
import { VendorBusinessRoute } from "../../../services/vendorBusinessContext";
import { vendorAuthenticatedFetch } from "../../../services/vendorAuthenticatedFetch";

vi.mock("../../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../../services/vendorAuthenticatedFetch", () => ({
  vendorAuthenticatedFetch: vi.fn(),
}));

const json = (value: unknown) => new Response(JSON.stringify(value), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

const account = {
  username: "vendor",
  first_name: "Avery",
  last_name: "Paws",
  email: "avery@example.test",
  phone: "",
  businesses: [],
};

function renderWorkspace(initialPath: string, businessType: string) {
  const business = {
    id: "business-42",
    name: "Pawdigree Store",
    business_type: businessType,
    verification_status: "APPROVED",
  };
  vi.mocked(vendorAuthenticatedFetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/api/businesses/business-42/")) return json(business);
    if (url.endsWith("/api/businesses/")) return json([business]);
    if (url.endsWith("/api/auth/current-user/")) return json(account);
    return new Response(null, { status: 404 });
  });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/vendor/business/:businessId/profile"
          element={
            <VendorBusinessRoute>
              <VendorProfilePage />
            </VendorBusinessRoute>
          }
        />
        <Route
          path="/vendor/business/:businessId/*"
          element={
            <VendorBusinessRoute>
              <VendorLayout title="Business workspace" description="Selected business workspace.">
                <p>Business section</p>
              </VendorLayout>
            </VendorBusinessRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("business-scoped vendor profile navigation", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    ["adoption-applications", "PET_SALE_ADOPTION", "Adoption applications"],
    ["services/new", "SERVICE_PROVIDER", "Add Service"],
    ["merchandise", "PRODUCT_SELLER", "Merchandise"],
  ])("retains the %s business sidebar when opening My Profile", async (section, type, expectedItem) => {
    const user = userEvent.setup();
    renderWorkspace(`/vendor/business/business-42/${section}`, type);

    expect(await screen.findByText("Business section")).toBeInTheDocument();
    const profilePath = "/vendor/business/business-42/profile";
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute("href", profilePath);
    expect(screen.getByRole("link", { name: "My vendor profile" })).toHaveAttribute("href", profilePath);

    await user.click(screen.getByRole("link", { name: "My Profile" }));

    expect(await screen.findByText("Personal vendor account")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: expectedItem })).toHaveAttribute("href", expect.stringContaining(`/vendor/business/business-42/`));
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith("http://api.test/api/businesses/business-42/");
  });

  it.each([
    ["PET_SALE_ADOPTION", "Adoption applications"],
    ["PRODUCT_SELLER", "Merchandise"],
    ["SERVICE_PROVIDER", "Add Service"],
  ])("restores the correct %s sidebar on a direct profile load", async (type, expectedItem) => {
    renderWorkspace("/vendor/business/business-42/profile", type);

    expect(await screen.findByText("Personal vendor account")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("link", { name: expectedItem })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute(
      "href",
      "/vendor/business/business-42/profile",
    );
  });

  it.each(["PET_SALE_ADOPTION", "PRODUCT_SELLER", "SERVICE_PROVIDER"])(
    "keeps Dashboard and Notifications inside the selected %s business workspace",
    async (type) => {
      const user = userEvent.setup();
      renderWorkspace("/vendor/business/business-42/profile", type);

      expect(await screen.findByText("Personal vendor account")).toBeInTheDocument();
      const dashboard = screen.getByRole("link", { name: "Dashboard" });
      const notifications = screen.getByRole("link", { name: "Notifications" });
      expect(dashboard).toHaveAttribute("href", "/vendor/business/business-42/dashboard");
      expect(notifications).toHaveAttribute("href", "/vendor/business/business-42/notifications");

      await user.click(notifications);
      expect(await screen.findByText("Business section")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/vendor/business/business-42/dashboard");

      await user.click(screen.getByRole("link", { name: "Dashboard" }));
      expect(await screen.findByText("Business section")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    },
  );

  it.each(["PET_SALE_ADOPTION", "PRODUCT_SELLER"])("hides Availability for %s businesses", async (type) => {
    renderWorkspace("/vendor/business/business-42/dashboard", type);
    expect(await screen.findByText("Business section")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Availability" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("href", "/vendor/business/business-42/notifications");
  });

  it("shows merchandise business navigation without Bookings", async () => {
    renderWorkspace("/vendor/business/business-42/dashboard", "PRODUCT_SELLER");
    expect(await screen.findByText("Business section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Merchandise" })).toHaveAttribute("href", "/vendor/business/business-42/merchandise");
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/vendor/business/business-42/orders");
    expect(screen.queryByRole("link", { name: "Availability" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("href", "/vendor/business/business-42/notifications");
    expect(screen.queryByRole("link", { name: "Bookings" })).not.toBeInTheDocument();
  });

  it("keeps adoption separate from pet sale orders", async () => {
    renderWorkspace("/vendor/business/business-42/dashboard", "PET_SALE_ADOPTION");
    expect(await screen.findByText("Business section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/vendor/business/business-42/listings");
    expect(screen.getByRole("link", { name: "Pet Sales" })).toHaveAttribute("href", "/vendor/business/business-42/listings?type=SALE");
    expect(screen.getByRole("link", { name: "Adoption applications" })).toHaveAttribute("href", "/vendor/business/business-42/adoption-applications");
    expect(screen.getByRole("link", { name: "Pet Sale Orders" })).toHaveAttribute("href", "/vendor/business/business-42/orders");
    expect(screen.queryByRole("link", { name: "Availability" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("href", "/vendor/business/business-42/notifications");
    expect(screen.queryByRole("link", { name: "Bookings" })).not.toBeInTheDocument();
  });

  it("shows service Catalog, Bookings and Availability for service businesses", async () => {
    renderWorkspace("/vendor/business/business-42/dashboard", "SERVICE_PROVIDER");
    expect(await screen.findByText("Business section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/vendor/business/business-42/services");
    expect(screen.getByRole("link", { name: "Bookings" })).toHaveAttribute("href", "/vendor/business/business-42/orders");
    expect(screen.getByRole("link", { name: "Availability" })).toHaveAttribute("href", "/vendor/business/business-42/availability");
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("href", "/vendor/business/business-42/notifications");
  });

});

describe("main vendor sidebar navigation", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows Merchandise under Your Store on the unscoped vendor dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/vendor/dashboard"]}>
        <VendorSidebar />
      </MemoryRouter>,
    );

    const storeNavigation = screen.getByRole("navigation", { name: "Vendor navigation" });
    const merchandiseLink = screen.getByRole("link", { name: "Merchandise" });
    expect(storeNavigation).toContainElement(merchandiseLink);
    expect(screen.getByText("YOUR STORE").parentElement).toContainElement(merchandiseLink);
    expect(merchandiseLink).toHaveAttribute("href", "/vendor/merchandise");
  });
});

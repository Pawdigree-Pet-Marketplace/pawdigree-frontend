import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorLayout from "../../../layouts/VendorLayout/VendorLayout";
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
    "keeps Dashboard and Availability inside the selected %s business workspace",
    async (type) => {
      const user = userEvent.setup();
      renderWorkspace("/vendor/business/business-42/profile", type);

      expect(await screen.findByText("Personal vendor account")).toBeInTheDocument();
      const dashboard = screen.getByRole("link", { name: "Dashboard" });
      const availability = screen.getByRole("link", { name: "Availability" });
      expect(dashboard).toHaveAttribute("href", "/vendor/business/business-42/dashboard");
      expect(availability).toHaveAttribute("href", "/vendor/business/business-42/availability");

      await user.click(availability);
      expect(await screen.findByText("Business section")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Availability" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/vendor/business/business-42/dashboard");

      await user.click(screen.getByRole("link", { name: "Dashboard" }));
      expect(await screen.findByText("Business section")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    },
  );

});

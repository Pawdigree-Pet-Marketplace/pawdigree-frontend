import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import VendorBusinessSwitcher from "./VendorBusinessSwitcher";

vi.mock("../../../services/vendorBusinessStore", () => ({
  useVendorBusinesses: () => ({
    loading: false,
    error: "",
    businesses: [
      { id: "42", name: "Adoption Store", business_type: "PET_SALE_ADOPTION" },
      { id: "99", name: "Merchandise Store", business_type: "PRODUCT_SELLER" },
      { id: "77", name: "Services Store", business_type: "SERVICE_PROVIDER" },
    ],
  }),
}));

function CurrentPath() {
  const location = useLocation();
  return <output>{location.pathname}</output>;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("VendorBusinessSwitcher", () => {
  it.each([
    ["99", "Merchandise Store"],
    ["77", "Services Store"],
  ])("switches to business %s and retains the current Availability section", async (nextId, name) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/vendor/business/42/availability"]}>
        <VendorBusinessSwitcher />
        <Routes>
          <Route path="/vendor/business/:businessId/*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText(/switch business/i));
    await user.click(screen.getByRole("menuitemradio", { name }));

    expect(screen.getByText(`/vendor/business/${nextId}/availability`)).toBeInTheDocument();
  });
});

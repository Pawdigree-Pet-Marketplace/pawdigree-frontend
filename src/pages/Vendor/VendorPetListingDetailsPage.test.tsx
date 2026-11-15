import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorPetListingDetailsPage from "./VendorPetListingDetailsPage";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";

vi.mock("../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch: vi.fn() }));
vi.mock("../../services/vendorBusinessStore", () => ({ useVendorBusiness: () => null }));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => <div><h1>{title}</h1>{children}</div>,
}));
vi.mock("../../components/BackButton/BackButton", () => ({ default: () => <a href="/vendor/listings">Back</a> }));

const pet = {
  pet_id: 17, name: "Nemo", species: "Fish", breed: "Clownfish", age: 5,
  gender: "UNKNOWN", size: "SMALL", description: "A friendly fish with a bright orange coat.",
  listing_type: "ADOPTION", adoption_status: "AVAILABLE", approved: false,
  review_status: "Pending approval", business: 3,
  images: [
    { image_id: 1, image: "/media/nemo-1.jpg", is_primary: true, position: 0 },
    { image_id: 2, image: "/media/nemo-2.jpg", position: 1 },
    { image_id: 3, image: "/media/nemo-3.jpg", position: 2 },
  ],
};

function renderPage() {
  return render(<MemoryRouter initialEntries={["/vendor/listings/17"]}><Routes><Route path="/vendor/listings/:petId" element={<VendorPetListingDetailsPage />} /></Routes></MemoryRouter>);
}

describe("VendorPetListingDetailsPage", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows the complete vendor listing, all gallery images and the edit action", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(new Response(JSON.stringify([pet]), { status: 200 }));
    renderPage();

    expect(await screen.findByText("A friendly fish with a bright orange coat.")).toBeInTheDocument();
    expect(screen.getByText("5 months old")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next photo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit Listing" })).toHaveAttribute("href", "/vendor/edit-pet/17");
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith("http://api.test/api/pets/");
  });

  it("advances the carousel without leaving the listing", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(new Response(JSON.stringify([pet]), { status: 200 }));
    renderPage();
    await screen.findByRole("img", { name: "Nemo photo 1 of 3" });
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByRole("img", { name: "Nemo photo 2 of 3" })).toBeInTheDocument();
  });
});

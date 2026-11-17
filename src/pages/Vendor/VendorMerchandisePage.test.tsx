import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VendorMerchandisePage from "./VendorMerchandisePage";
import { getCategories, type Category } from "../../services/categoryService";
import { getMerchandise } from "../../services/merchandiseApi";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import { VendorBusinessContext } from "../../services/vendorBusinessStore";
import { createMerchandise, updateMerchandise } from "../../services/merchandiseApi";

vi.mock("../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../services/categoryService", () => ({
  getCategories: vi.fn(),
  categoryKindForBusinessType: (type?: string | null) => ({
    PET_SALE_ADOPTION: "pets",
    PRODUCT_SELLER: "merchandise",
    SERVICE_PROVIDER: "services",
  }[type ?? ""] ?? null),
}));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({
  vendorAuthenticatedFetch: vi.fn(),
}));
vi.mock("../../services/merchandiseApi", () => ({
  getMerchandise: vi.fn(),
  createMerchandise: vi.fn(),
  updateMerchandise: vi.fn(),
  deactivateMerchandise: vi.fn(),
}));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("VendorMerchandisePage categories", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows only active merchandise categories for the selected product business", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" }]), { status: 200 }),
    );
    vi.mocked(getMerchandise).mockResolvedValue([]);
    vi.mocked(getCategories).mockResolvedValue([
      { id: 1, name: "Leashes", slug: "leashes", kind: "merchandise", is_active: true },
      { id: 2, name: "Grooming", slug: "grooming", kind: "services", is_active: true },
      { id: 3, name: "Old Toys", slug: "old-toys", kind: "merchandise", is_active: false },
      { id: 4, name: "General", slug: "general", kind: "general", is_active: true },
    ] as Category[]);
    const business = {
      id: "biz-1",
      name: "Paw Supplies",
      business_type: "PRODUCT_SELLER",
    };

    render(
      <MemoryRouter>
        <VendorBusinessContext.Provider value={{ business }}>
          <VendorMerchandisePage />
        </VendorBusinessContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(getCategories).toHaveBeenCalledWith("merchandise"));
    fireEvent.click(await screen.findByRole("button", { name: /add merchandise/i }));

    const category = screen.getByLabelText("Category *");
    await waitFor(() => expect(category).toHaveDisplayValue("Leashes"));
    expect(screen.getByRole("option", { name: "Leashes" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Grooming" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Old Toys" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "General" })).not.toBeInTheDocument();
  });

  it("caps product description input at 300 words", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" }]), { status: 200 }),
    );
    vi.mocked(getMerchandise).mockResolvedValue([]);
    vi.mocked(getCategories).mockResolvedValue([
      { id: 1, name: "Leashes", slug: "leashes", kind: "merchandise", is_active: true },
    ] as Category[]);
    const business = { id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" };
    render(<MemoryRouter><VendorBusinessContext.Provider value={{ business }}><VendorMerchandisePage /></VendorBusinessContext.Provider></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /add merchandise/i }));
    fireEvent.change(screen.getByLabelText("Product name *"), { target: { value: "Dog leash" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: Array(301).fill("word").join(" ") } });
    fireEvent.change(screen.getByLabelText("Price (UGX) *"), { target: { value: "10" } });
    expect(screen.getByLabelText("Description")).toHaveValue(Array(300).fill("word").join(" "));
    expect(screen.getByText(/300 \/ 300 words/)).toBeInTheDocument();
    expect(screen.getByText("Description is limited to 300 words.")).toBeInTheDocument();
    expect(createMerchandise).not.toHaveBeenCalled();
    expect(updateMerchandise).not.toHaveBeenCalled();
  });
});
import type { ReactNode } from "react";

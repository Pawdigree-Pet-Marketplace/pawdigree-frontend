import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VendorMerchandisePage from "./VendorMerchandisePage";
import { getCategories, type Category } from "../../services/categoryService";
import { getMerchandise } from "../../services/merchandiseApi";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import { VendorBusinessContext } from "../../services/vendorBusinessStore";
import {
  createMerchandise,
  deleteMerchandiseImage,
  updateMerchandise,
  uploadMerchandiseImage,
  type Merchandise,
} from "../../services/merchandiseApi";

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
  uploadMerchandiseImage: vi.fn(),
  deleteMerchandiseImage: vi.fn(),
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

  it("requires a positive price", async () => {
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
    fireEvent.change(screen.getByLabelText("Price (UGX) *"), { target: { value: "0" } });
    fireEvent.submit(document.querySelector("form.vm-form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent("greater than zero");
    expect(createMerchandise).not.toHaveBeenCalled();
  });

  it("creates the product first, then uploads selected photos", async () => {
    const createdProduct: Merchandise = {
      id: 21,
      business: "biz-1",
      category: 1,
      name: "Cat bed",
      description: "Soft bed",
      price: "15000.00",
      stock_quantity: 1,
      is_active: true,
      approved: false,
      rejection_reason: "",
      images: [],
    };
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" }]), { status: 200 }),
    );
    vi.mocked(getMerchandise).mockResolvedValue([]);
    vi.mocked(getCategories).mockResolvedValue([
      { id: 1, name: "Leashes", slug: "leashes", kind: "merchandise", is_active: true },
    ] as Category[]);
    vi.mocked(createMerchandise).mockResolvedValue(createdProduct);
    let finishUpload!: (image: Awaited<ReturnType<typeof uploadMerchandiseImage>>) => void;
    vi.mocked(uploadMerchandiseImage).mockReturnValue(
      new Promise((resolve) => { finishUpload = resolve; }),
    );
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:new-product") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const business = { id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" };
    render(<MemoryRouter><VendorBusinessContext.Provider value={{ business }}><VendorMerchandisePage /></VendorBusinessContext.Provider></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: /add merchandise/i }));
    fireEvent.change(screen.getByLabelText("Product name *"), { target: { value: "Cat bed" } });
    fireEvent.change(screen.getByLabelText("Price (UGX) *"), { target: { value: "15000" } });
    await waitFor(() => expect(screen.getByLabelText("Category *")).toHaveDisplayValue("Leashes"));
    const file = new File(["image"], "cat-bed.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Product photos", { selector: "input" }), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Save product" }));

    await waitFor(() => expect(uploadMerchandiseImage).toHaveBeenCalledWith(21, file, "Cat bed", 0));
    expect(await screen.findByText(/uploading photo 1 of 1/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    finishUpload({
      id: 22,
      image: "https://media.test/cat-bed.png",
      alt_text: "Cat bed",
      display_order: 0,
    });
    expect(createMerchandise).toHaveBeenCalledWith(expect.objectContaining({ business: "biz-1", category: 1 }));
    expect(await screen.findByText(/awaiting admin approval before customers can see it/i)).toBeInTheDocument();
  });

  it("enforces the five-photo limit before uploading", async () => {
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
    const files = Array.from({ length: 6 }, (_, index) => new File(["image"], `photo-${index}.png`, { type: "image/png" }));
    fireEvent.change(screen.getByLabelText("Product photos", { selector: "input" }), { target: { files } });

    expect(screen.getByRole("alert")).toHaveTextContent("at most five photos");
    expect(screen.queryByText("Not uploaded yet")).not.toBeInTheDocument();
  });

  it("keeps saved photos when editing and uploads a selected photo after saving", async () => {
    const existingProduct: Merchandise = {
      id: 7,
      business: "biz-1",
      category: 1,
      name: "Dog leash",
      description: "A sturdy leash",
      price: "12000.00",
      stock_quantity: 3,
      is_active: true,
      approved: true,
      rejection_reason: "",
      images: [{ id: 9, image: "https://media.test/existing.png", alt_text: "Existing leash", display_order: 0 }],
    };
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" }]), { status: 200 }),
    );
    vi.mocked(getMerchandise).mockResolvedValue([existingProduct]);
    vi.mocked(getCategories).mockResolvedValue([
      { id: 1, name: "Leashes", slug: "leashes", kind: "merchandise", is_active: true },
    ] as Category[]);
    vi.mocked(updateMerchandise).mockResolvedValue(existingProduct);
    vi.mocked(uploadMerchandiseImage).mockResolvedValue({
      id: 10,
      image: "https://media.test/new.png",
      alt_text: "Dog leash",
      display_order: 1,
    });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const business = { id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" };
    render(<MemoryRouter><VendorBusinessContext.Provider value={{ business }}><VendorMerchandisePage /></VendorBusinessContext.Provider></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getAllByRole("img", { name: "Existing leash" })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Preview saved photo: Existing leash" }));
    expect(screen.getByRole("dialog", { name: "Product photo preview" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close photo preview" }));
    const file = new File(["image"], "new.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Product photos", { selector: "input" }), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Preview selected photo 1" }));
    expect(screen.getAllByRole("img", { name: "Selected photo 1" })).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "Selected photo 1" })[0]).toHaveAttribute("src", "blob:preview");
    fireEvent.click(screen.getByRole("button", { name: "Close photo preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Update product" }));

    await waitFor(() => expect(uploadMerchandiseImage).toHaveBeenCalledWith(7, file, "Dog leash", 1));
    expect(deleteMerchandiseImage).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("awaiting admin approval");
  });

  it("lets vendors browse every saved image from the product card", async () => {
    const product: Merchandise = {
      id: 12,
      business: "biz-1",
      category: 1,
      name: "Travel bowl",
      description: "",
      price: "5000.00",
      stock_quantity: 2,
      is_active: true,
      approved: true,
      rejection_reason: "",
      images: [
        { id: 21, image: "https://media.test/front.png", alt_text: "Bowl front", display_order: 0 },
        { id: 22, image: "https://media.test/side.png", alt_text: "Bowl side", display_order: 1 },
      ],
    };
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" }]), { status: 200 }),
    );
    vi.mocked(getMerchandise).mockResolvedValue([product]);
    const business = { id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" };
    render(<MemoryRouter><VendorBusinessContext.Provider value={{ business }}><VendorMerchandisePage /></VendorBusinessContext.Provider></MemoryRouter>);

    const secondPhotoButton = await screen.findByRole("button", { name: "Show photo 2 of 2" });
    expect(screen.getByRole("img", { name: "Bowl front" })).toHaveAttribute("src", "https://media.test/front.png");
    fireEvent.click(secondPhotoButton);
    expect(screen.getByRole("img", { name: "Bowl side" })).toHaveAttribute("src", "https://media.test/side.png");
  });

  it("deletes a saved photo only when the edited product is saved", async () => {
    const product: Merchandise = {
      id: 8,
      business: "biz-1",
      category: 1,
      name: "Cat toy",
      description: "",
      price: "5000.00",
      stock_quantity: 2,
      is_active: true,
      approved: true,
      rejection_reason: "",
      images: [{ id: 11, image: "https://media.test/toy.png", alt_text: "Cat toy", display_order: 0 }],
    };
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" }]), { status: 200 }),
    );
    vi.mocked(getMerchandise).mockResolvedValue([product]);
    vi.mocked(getCategories).mockResolvedValue([
      { id: 1, name: "Leashes", slug: "leashes", kind: "merchandise", is_active: true },
    ] as Category[]);
    vi.mocked(updateMerchandise).mockResolvedValue(product);
    vi.mocked(deleteMerchandiseImage).mockResolvedValue(undefined);
    const business = { id: "biz-1", name: "Paw Supplies", business_type: "PRODUCT_SELLER" };
    render(<MemoryRouter><VendorBusinessContext.Provider value={{ business }}><VendorMerchandisePage /></VendorBusinessContext.Provider></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove saved photo" }));
    expect(deleteMerchandiseImage).not.toHaveBeenCalled();
    expect(screen.getByText("Will be removed when saved")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Update product" }));

    await waitFor(() => expect(deleteMerchandiseImage).toHaveBeenCalledWith(8, 11));
    expect(await screen.findByRole("status")).toHaveTextContent("awaiting admin approval");
  });
});

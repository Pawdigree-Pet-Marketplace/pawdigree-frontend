import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fetchProduct } from "../../services/publicMerchandiseApi";
import ProductDetailsPage from "./ProductDetailsPage";

vi.mock("../../services/publicMerchandiseApi", () => ({
  fetchProduct: vi.fn(),
}));

vi.mock("../../components/cart/AddToCartButton", () => ({
  default: () => <button type="button">Add to Cart</button>,
}));

const product = {
  id: 42,
  name: "Cozy pet bed",
  price: "45000.00",
  category: 3,
  category_name: "Beds",
  is_available: true,
  business_name: "Paws Corner",
  main_image: "https://example.test/bed-main.jpg",
  description: "A soft bed for small pets.",
  images: [
    { id: 1, image: "https://example.test/bed-main.jpg", alt_text: "Main", display_order: 0 },
    { id: 2, image: "https://example.test/bed-side.jpg", alt_text: "Side", display_order: 1 },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/merchandise/42"]}>
      <Routes>
        <Route path="/merchandise/:productId" element={<ProductDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProductDetailsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads product details, gallery images, availability, and cart action by ID", async () => {
    vi.mocked(fetchProduct).mockResolvedValue(product);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Cozy pet bed" })).toBeInTheDocument();
    expect(fetchProduct).toHaveBeenCalledWith("42");
    expect(screen.getByText("A soft bed for small pets.")).toBeInTheDocument();
    expect(screen.getByText("UGX 45,000")).toBeInTheDocument();
    expect(screen.getByText("Paws Corner")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View product photo 2" }));
    await waitFor(() => expect(screen.getByRole("img", { name: "Cozy pet bed" })).toHaveAttribute("src", "https://example.test/bed-side.jpg"));
  });

  it("prevents adding an unavailable product to the cart", async () => {
    vi.mocked(fetchProduct).mockResolvedValue({ ...product, is_available: false });
    renderPage();

    expect(await screen.findByText("Currently unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add to Cart" })).not.toBeInTheDocument();
  });

  it("shows the not-found state for a missing product", async () => {
    vi.mocked(fetchProduct).mockRejectedValue(new Error("detail: Not found."));
    renderPage();

    expect(await screen.findByRole("heading", { name: "Product not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse merchandise" })).toHaveAttribute("href", "/merchandise");
  });
});

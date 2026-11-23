import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Merchandise from "./Merchandise";
import { fetchProducts } from "../../services/publicMerchandiseApi";

vi.mock("../../services/publicMerchandiseApi", () => ({
  fetchProducts: vi.fn(),
}));
vi.mock("../merchandise/MerchGrid", () => ({
  default: ({ products }: { products: { id: number; name: string }[] }) => (
    <div data-testid="featured-merchandise">
      {products.map((product) => <span key={product.id}>{product.name}</span>)}
    </div>
  ),
}));

const product = (id: number) => ({
  id,
  name: `Product ${id}`,
  price: "1000",
  category: 1,
  category_name: "Toys",
  business_name: "Paw Supplies",
  is_available: true,
  main_image: null,
});

function renderSection() {
  return render(<MemoryRouter><Merchandise /></MemoryRouter>);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("homepage merchandise", () => {
  it("loads public merchandise cards and links to the full marketplace", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      count: 5,
      results: [1, 2, 3, 4, 5].map(product),
    });

    renderSection();

    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 4")).toBeInTheDocument();
    expect(screen.queryByText("Product 5")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse all merchandise/i })).toHaveAttribute(
      "href",
      "/merchandise",
    );
  });

  it("shows loading and empty states", async () => {
    let resolveProducts!: (result: { count: number; results: never[] }) => void;
    vi.mocked(fetchProducts).mockReturnValue(
      new Promise((resolve) => { resolveProducts = resolve; }),
    );

    const view = renderSection();
    expect(screen.getByRole("status")).toHaveTextContent("Loading merchandise");
    resolveProducts({ count: 0, results: [] });
    expect(await screen.findByText(/no merchandise is available yet/i)).toBeInTheDocument();
    view.unmount();
  });

  it("shows an error with retry when the public request fails", async () => {
    vi.mocked(fetchProducts)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ count: 0, results: [] });

    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText(/no merchandise is available yet/i)).toBeInTheDocument();
    expect(fetchProducts).toHaveBeenCalledTimes(2);
  });
});

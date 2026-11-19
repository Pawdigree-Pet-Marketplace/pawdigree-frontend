
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MerchandisePage from "./MerchandisePage";
import {
  fetchMerchCategories,
  fetchProducts,
} from "../../services/publicMerchandiseApi";
import type { Product } from "../../data/merchandise";

vi.mock("../../services/publicMerchandiseApi", () => ({
  fetchProducts: vi.fn(),
  fetchMerchCategories: vi.fn(),
}));

// MerchandisePage tests do not need to test cart functionality.
// Mock the button so these tests do not require CartProvider.
vi.mock("../../components/cart/AddToCartButton", () => ({
  default: () => null,
}));

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Chew Bone",
    price: "15000.00",
    category: 1,
    category_name: "Toys",
    business_name: "Happy Paws",
    is_available: true,
    main_image: null,
    ...overrides,
  };
}

function renderPage(entry = "/merchandise") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <MerchandisePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // jsdom does not implement matchMedia (the page uses it to scroll to results)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });

  Element.prototype.scrollIntoView = vi.fn();

  vi.mocked(fetchMerchCategories).mockResolvedValue([]);

  vi.mocked(fetchProducts).mockResolvedValue({
    count: 2,
    results: [
      makeProduct(),
      makeProduct({ id: 2, name: "Dog Leash", is_available: false }),
    ],
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MerchandisePage", () => {
  it("shows the heading and the products returned by the API", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Pet Merchandise" }),
    ).toBeTruthy();

    expect(
      await screen.findByRole("heading", { name: "Chew Bone" }),
    ).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Dog Leash" })).toBeTruthy();
    expect(screen.getByText("Showing 1–2 of 2 products")).toBeTruthy();

    expect(fetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, search: "" }),
    );
  });

  it("marks out-of-stock products but still lists them", async () => {
    renderPage();

    const inStockCard = (
      await screen.findByRole("heading", { name: "Chew Bone" })
    ).closest("article") as HTMLElement;

    const outOfStockCard = screen
      .getByRole("heading", { name: "Dog Leash" })
      .closest("article") as HTMLElement;

    expect(within(inStockCard).getByText("In stock")).toBeTruthy();
    expect(within(outOfStockCard).getByText("Out of stock")).toBeTruthy();
  });

  it("shows an empty state when there are no products", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({ count: 0, results: [] });

    renderPage();

    expect(await screen.findByText("No products listed yet")).toBeTruthy();
  });

  it("shows an error and loads again when Try again is clicked", async () => {
    vi.mocked(fetchProducts).mockRejectedValueOnce(new Error("network"));

    renderPage();

    expect(
      await screen.findByText(/couldn.t load the products/i),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Chew Bone" }),
    ).toBeTruthy();
  });

  it("links each card to its details page", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Chew Bone" });

    const links = screen.getAllByRole("link", { name: "View" });

    expect(links[0].getAttribute("href")).toBe("/merchandise/1");
  });

  it("rejects a minimum price above the maximum", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Chew Bone" });

    fireEvent.change(screen.getByLabelText("Minimum price in UGX"), {
      target: { value: "5000" },
    });

    fireEvent.change(screen.getByLabelText("Maximum price in UGX"), {
      target: { value: "1000" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /minimum price must be less than or equal/i,
    );
  });

  it("shows a removable chip for an applied price filter", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Chew Bone" });

    fireEvent.change(screen.getByLabelText("Minimum price in UGX"), {
      target: { value: "1000" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    const chip = await screen.findByRole("button", {
      name: /Remove filter UGX 1000/,
    });

    fireEvent.click(chip);

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Remove filter UGX/ }),
      ).toBeNull(),
    );
  });

  it("goes back to page 1 when filters are applied", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      count: 30,
      results: [makeProduct()],
    });

    renderPage("/merchandise?page=2");

    await screen.findByRole("heading", { name: "Chew Bone" });

    fireEvent.change(screen.getByLabelText("Minimum price in UGX"), {
      target: { value: "1000" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() =>
      expect(fetchProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, minPrice: "1000" }),
      ),
    );
  });

  it("filters by vendor and shows a removable chip", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Chew Bone" });

    fireEvent.change(screen.getByLabelText("Vendor"), {
      target: { value: "Happy Paws" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() =>
      expect(fetchProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ vendor: "Happy Paws" }),
      ),
    );

    expect(
      await screen.findByRole("button", {
        name: /Remove filter Vendor: Happy Paws/,
      }),
    ).toBeTruthy();
  });
});

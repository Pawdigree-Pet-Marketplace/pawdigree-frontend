import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";
import { fetchProducts } from "./merchandiseApi";
import { readMerchQuery } from "../data/merchandise";

vi.mock("./api", () => ({ apiRequest: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchProducts", () => {
  it("sends only the page for a plain query", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ count: 0, results: [] });

    await fetchProducts(readMerchQuery(new URLSearchParams()));

    expect(apiRequest).toHaveBeenCalledWith(
      "/products/public/?page=1&page_size=12",
    );
  });

  it("maps the filters to the backend parameter names", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ count: 0, results: [] });

    await fetchProducts(
      readMerchQuery(
        new URLSearchParams(
          "search=dog food&category=2&vendor=Paws Corner&min_price=5000&max_price=50000&in_stock=1&sort=price_asc&page=2",
        ),
      ),
    );

    expect(apiRequest).toHaveBeenCalledWith(
      "/products/public/?page=2&page_size=12&search=dog+food&category=2&business_name=Paws+Corner&price_min=5000&price_max=50000&in_stock=true&sort=price_asc",
    );
  });

  it("accepts a plain list response", async () => {
    vi.mocked(apiRequest).mockResolvedValue([]);

    const res = await fetchProducts(readMerchQuery(new URLSearchParams()));

    expect(res).toEqual({ count: 0, results: [] });
  });
});
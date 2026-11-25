import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";
import { fetchServices } from "./publicServicesApi";

vi.mock("./api", () => ({ apiRequest: vi.fn() }));

afterEach(() => vi.clearAllMocks());

describe("public services API", () => {
  it("requests the paginated public services endpoint", async () => {
    const data = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(apiRequest).mockResolvedValue(data);

    await expect(fetchServices({
      search: "", category: "", cityDistrict: "", minPrice: "", maxPrice: "", page: 1,
    })).resolves.toEqual(data);

    expect(apiRequest).toHaveBeenCalledWith("/services/public/?page=1&page_size=12");
  });
});

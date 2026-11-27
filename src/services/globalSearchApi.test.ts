import { afterEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ default: "https://api.pawdigree.test", apiRequest: apiRequestMock }));

import { fetchGlobalSuggestions } from "./globalSearchApi";

afterEach(() => apiRequestMock.mockReset());

describe("fetchGlobalSuggestions", () => {
  it("queries all public resources in parallel and normalizes list and paged responses", async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path.startsWith("/businesses/")) return Promise.resolve([{ id: "business-uuid", name: "Ari Havens", city_district: "Kampala", logo: "/media/ari.png" }]);
      if (path.startsWith("/pets/")) return Promise.resolve({ count: 1, results: [{ pet_id: 12, name: "Ari", breed: "Mixed breed", business_name: "Ari Havens", images: [{ image: "/media/ari-pet.jpg", is_primary: true }] }] });
      if (path.startsWith("/products/")) return Promise.resolve({ results: [{ id: 9, name: "Ari collar", price: "25000.00", business_name: "Ari Havens", main_image: "https://cdn.test/collar.jpg" }] });
      return Promise.resolve({ count: 1, results: [{ service_id: 4, name: "Ari grooming", service_type: "Grooming", business_name: "Ari Havens", image: "/media/grooming.jpg" }] });
    });

    const suggestions = await fetchGlobalSuggestions("Ari");

    expect(apiRequestMock).toHaveBeenCalledTimes(4);
    expect(apiRequestMock.mock.calls.map(([path]) => path)).toEqual(expect.arrayContaining([
      "/businesses/public/?search=Ari",
      "/pets/public/?search=Ari&page_size=5",
      "/products/public/?search=Ari&page_size=5",
      "/services/public/?search=Ari&page_size=5",
    ]));
    expect(suggestions.suggestions.map(({ kind }) => kind)).toEqual(["business", "pet", "product", "service"]);
    expect(suggestions.suggestions.map(({ href }) => href)).toEqual([
      "/vendors/business-uuid", "/pets/12", "/merchandise/9", "/services/4",
    ]);
    expect(suggestions.suggestions[0]).toMatchObject({ label: "Ari Havens", hint: "Kampala", image: "https://api.pawdigree.test/media/ari.png" });
    expect(suggestions.suggestions[1]).toMatchObject({ label: "Ari", hint: "Mixed breed · Ari Havens", image: "https://api.pawdigree.test/media/ari-pet.jpg" });
    expect(suggestions.suggestions[2]?.hint).toContain("UGX 25,000");
    expect(suggestions.suggestions[3]?.hint).toBe("Grooming · Ari Havens");
    expect(suggestions.warning).toBeUndefined();
  });

  it("skips short input, reports partial failures, and fails usefully when every resource errors", async () => {
    expect(await fetchGlobalSuggestions("A")).toEqual({ suggestions: [] });
    expect(apiRequestMock).not.toHaveBeenCalled();

    apiRequestMock.mockImplementation((path: string) => path.startsWith("/businesses/")
      ? Promise.reject(new Error("Offline"))
      : Promise.resolve([]));
    const partial = await fetchGlobalSuggestions("Ari");
    expect(partial.warning).toMatch(/some marketplace categories/i);

    apiRequestMock.mockRejectedValue(new Error("Offline"));
    await expect(fetchGlobalSuggestions("Ari")).rejects.toThrow(/marketplace suggestions are temporarily unavailable/i);
  });
});

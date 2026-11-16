import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";
import { categoryKindForBusinessType, getCategories } from "./categoryService";

vi.mock("./api", () => ({ apiRequest: vi.fn() }));

describe("categoryService", () => {
  afterEach(() => vi.clearAllMocks());

  it.each([
    ["PET_SALE_ADOPTION", "pets"],
    ["PRODUCT_SELLER", "merchandise"],
    ["SERVICE_PROVIDER", "services"],
  ])("maps %s to its category kind", (businessType, kind) => {
    expect(categoryKindForBusinessType(businessType)).toBe(kind);
  });

  it("returns only active categories matching the requested kind", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce([
      { id: 1, name: "Dogs", slug: "dogs", kind: "pets", is_active: true },
      { id: 2, name: "Old Dogs", slug: "old-dogs", kind: "pets", is_active: false },
      { id: 3, name: "Grooming", slug: "grooming", kind: "services", is_active: true },
      { id: 4, name: "General", slug: "general", kind: "general", is_active: true },
    ]);

    await expect(getCategories("pets")).resolves.toEqual([
      { id: 1, name: "Dogs", slug: "dogs", kind: "pets", is_active: true },
    ]);
    expect(apiRequest).toHaveBeenCalledWith("/categories/public/?kind=pets");
  });
});

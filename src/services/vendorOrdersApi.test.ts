import { afterEach, describe, expect, it, vi } from "vitest";

const { vendorAuthenticatedFetch } = vi.hoisted(() => ({
  vendorAuthenticatedFetch: vi.fn(),
}));

vi.mock("./vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch }));

import { fetchVendorOrders, updateVendorOrderStatus } from "./vendorOrdersApi";

afterEach(() => vi.clearAllMocks());

describe("vendor orders API", () => {
  it("loads orders from the configured backend with an optional status filter", async () => {
    vendorAuthenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await expect(fetchVendorOrders("PROCESSING")).resolves.toEqual([]);
    const [url] = vendorAuthenticatedFetch.mock.calls[0] as [string];
    expect(url).toContain("/api/orders/vendor/?status=PROCESSING");
    expect(url).toMatch(/^https?:\/\//);
  });

  it("sends vendor status updates to the matching backend endpoint", async () => {
    const updated = { id: 42, status: "PROCESSING" };
    vendorAuthenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(updated), { status: 200 }),
    );

    await expect(updateVendorOrderStatus(42, "PROCESSING")).resolves.toEqual(updated);
    const [url, init] = vendorAuthenticatedFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/orders/vendor/42/status/");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ status: "PROCESSING" });
  });
});

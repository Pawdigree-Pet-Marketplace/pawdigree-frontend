
import { afterEach, describe, expect, it, vi } from "vitest";

const { vendorAuthenticatedFetch } = vi.hoisted(() => ({
  vendorAuthenticatedFetch: vi.fn(),
}));

vi.mock("./vendorAuthenticatedFetch", () => ({
  vendorAuthenticatedFetch,
}));

import {
  fetchVendorOrders,
  updateVendorOrderStatus,
} from "./vendorOrdersApi";

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

  it("loads vendor orders containing pet sale items", async () => {
    const petOrder = {
      id: 42,
      order_id: 100,
      business_name: "Happy Paws",
      status: "PAID",
      shipping_name: "Test Customer",
      shipping_phone: "0700000000",
      shipping_address: "Kampala",
      shipping_city_district: "Central",
      notes: "",
      total: "500000",
      created_at: "2026-11-19T10:00:00Z",
      updated_at: "2026-11-19T10:00:00Z",
      items: [
        {
          id: 7,
          item_type: "pet",
          pet: "pet-123",
          pet_name: "Buddy",
          name: "Buddy",
          quantity: null,
          unit_price: "500000",
          subtotal: "500000",
        },
      ],
    };

    vendorAuthenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([petOrder]), { status: 200 }),
    );

    const orders = await fetchVendorOrders();

    expect(orders).toHaveLength(1);
    expect(orders[0].items[0]).toMatchObject({
      item_type: "pet",
      pet: "pet-123",
      pet_name: "Buddy",
      quantity: null,
    });
  });

  it("sends vendor status updates to the matching backend endpoint", async () => {
    const updated = { id: 42, status: "PROCESSING" };

    vendorAuthenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(updated), { status: 200 }),
    );

    await expect(
      updateVendorOrderStatus(42, "PROCESSING"),
    ).resolves.toEqual(updated);

    const [url, init] = vendorAuthenticatedFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toContain("/api/orders/vendor/42/status/");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({
      status: "PROCESSING",
    });
  });
});

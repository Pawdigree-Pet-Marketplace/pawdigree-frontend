import { afterEach, describe, expect, it, vi } from "vitest";

const { vendorAuthenticatedFetch } = vi.hoisted(() => ({ vendorAuthenticatedFetch: vi.fn() }));
vi.mock("../vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch }));

import { fetchVendorBookings, updateVendorBookingStatus } from "./vendorBookingApi";

afterEach(() => vi.clearAllMocks());

describe("vendor booking API", () => {
  it("loads bookings from the authenticated vendor endpoint", async () => {
    vendorAuthenticatedFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    await expect(fetchVendorBookings()).resolves.toEqual([]);
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(expect.stringContaining("/api/bookings/vendor/"));
  });

  it("accepts a booking through the confirmed status endpoint", async () => {
    const booking = { booking_id: 8, status: "accepted" };
    vendorAuthenticatedFetch.mockResolvedValueOnce(new Response(JSON.stringify(booking), { status: 200 }));
    await expect(updateVendorBookingStatus(8, "accepted")).resolves.toEqual(booking);
    const [url, init] = vendorAuthenticatedFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/bookings/vendor/8/status/");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ status: "accepted" });
  });

  it("sends the required reason when declining a booking", async () => {
    vendorAuthenticatedFetch.mockResolvedValueOnce(new Response(JSON.stringify({ booking_id: 8 }), { status: 200 }));
    await updateVendorBookingStatus(8, "declined", "Please choose another time.");
    const [, init] = vendorAuthenticatedFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      status: "declined",
      decision_reason: "Please choose another time.",
    });
  });
});

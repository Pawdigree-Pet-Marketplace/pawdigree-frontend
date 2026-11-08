import { afterEach, describe, expect, it, vi } from "vitest";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";

describe("vendorAuthenticatedFetch", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("refreshes an expired access token and retries with the new token", async () => {
    localStorage.setItem("token", "expired-access");
    localStorage.setItem("refresh", "valid-refresh");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access: "new-access", refresh: "rotated-refresh" }),
      } as Response)
      .mockResolvedValueOnce({ status: 200 } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await vendorAuthenticatedFetch("/api/pets/");

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/auth/token/refresh/");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      refresh: "valid-refresh",
    });
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization")).toBe(
      "Bearer new-access",
    );
    expect(localStorage.getItem("token")).toBe("new-access");
    expect(localStorage.getItem("refresh")).toBe("rotated-refresh");
  });

    it("clears the session when the refresh token is rejected", async () => {
    localStorage.setItem("token", "expired-access");
    localStorage.setItem("refresh", "dead-refresh");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await vendorAuthenticatedFetch("/api/pets/");

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
  });

  it("clears the session when the retry is still unauthorized", async () => {
    localStorage.setItem("token", "expired-access");
    localStorage.setItem("refresh", "valid-refresh");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access: "new-access", refresh: "rotated-refresh" }),
      } as Response)
      .mockResolvedValueOnce({ status: 401 } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await vendorAuthenticatedFetch("/api/pets/");

    expect(response.status).toBe(401);
    expect(localStorage.getItem("token")).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { customerAuthenticatedFetch } from "./customerAuthenticatedFetch";

describe("customerAuthenticatedFetch", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("attaches the active customer's Bearer token", async () => {
    sessionStorage.setItem("token", "session-access");
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await customerAuthenticatedFetch("/api/auth/profile/");

    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization"))
      .toBe("Bearer session-access");
  });

  it("refreshes, stores rotated tokens in the selected storage, and retries once", async () => {
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

    const response = await customerAuthenticatedFetch("/api/auth/profile/");

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/auth/token/refresh/");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ refresh: "valid-refresh" });
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization"))
      .toBe("Bearer new-access");
    expect(localStorage.getItem("token")).toBe("new-access");
    expect(localStorage.getItem("refresh")).toBe("rotated-refresh");
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  it("keeps a non-remembered session in sessionStorage after refresh", async () => {
    sessionStorage.setItem("token", "expired-access");
    sessionStorage.setItem("refresh", "session-refresh");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401 } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access: "new-session-access" }) } as Response)
      .mockResolvedValueOnce({ status: 200 } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await customerAuthenticatedFetch("/api/auth/profile/");

    expect(sessionStorage.getItem("token")).toBe("new-session-access");
    expect(sessionStorage.getItem("refresh")).toBe("session-refresh");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("clears auth session when refresh fails", async () => {
    localStorage.setItem("token", "expired-access");
    localStorage.setItem("refresh", "invalid-refresh");
    localStorage.setItem("role", "CUSTOMER");
    localStorage.setItem("unrelated", "keep");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401 } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const response = await customerAuthenticatedFetch("/api/auth/profile/");

    expect(response.status).toBe(401);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });

  it("clears the session when the retried request remains unauthorized", async () => {
    sessionStorage.setItem("token", "expired-access");
    sessionStorage.setItem("refresh", "valid-refresh");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401 } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access: "still-invalid" }) } as Response)
      .mockResolvedValueOnce({ status: 401 } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await customerAuthenticatedFetch("/api/auth/profile/");

    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("refresh")).toBeNull();
  });
});

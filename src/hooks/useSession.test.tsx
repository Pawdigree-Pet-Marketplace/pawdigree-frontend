import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import useSession from "./useSession";
import {
  clearAuthSession,
  saveAuthSession,
} from "../services/auth/authStorage";

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

afterEach(() => {
  cleanup();
  clearAuthSession();
});

describe("useSession", () => {
  it("recognizes matching customer and vendor sessions", () => {
    saveAuthSession({
      access: "customer-token",
      refresh: "customer-refresh",
      role: "CUSTOMER",
    });
    const customer = renderHook(() => useSession("CUSTOMER"), { wrapper });
    expect(customer.result.current).toBe(true);
    customer.unmount();

    saveAuthSession({
      access: "vendor-token",
      refresh: "vendor-refresh",
      role: "VENDOR",
    });
    const vendor = renderHook(() => useSession("VENDOR"), { wrapper });
    expect(vendor.result.current).toBe(true);
  });

  it("recognizes remembered sessions in localStorage", () => {
    saveAuthSession({
      access: "customer-token",
      refresh: "customer-refresh",
      role: "CUSTOMER",
    });

    expect(
      renderHook(() => useSession("CUSTOMER"), { wrapper }).result.current,
    ).toBe(true);
  });

  it("does not combine a token and role from different storages", () => {
    localStorage.setItem("token", "stale-local-token");
    localStorage.setItem("role", "CUSTOMER");
    sessionStorage.setItem("token", "current-session-token");
    sessionStorage.setItem("refresh", "current-session-refresh");
    sessionStorage.setItem("role", "VENDOR");

    expect(
      renderHook(() => useSession("CUSTOMER"), { wrapper }).result.current,
    ).toBe(false);
    expect(
      renderHook(() => useSession("VENDOR"), { wrapper }).result.current,
    ).toBe(true);
  });

  it("uses the storage selected by authStorage when local data is stale", () => {
    sessionStorage.setItem("token", "current-token");
    sessionStorage.setItem("refresh", "current-refresh");
    sessionStorage.setItem("role", "VENDOR");
    localStorage.setItem("token", "stale-token");
    localStorage.setItem("role", "CUSTOMER");

    expect(
      renderHook(() => useSession("VENDOR"), { wrapper }).result.current,
    ).toBe(true);
    expect(
      renderHook(() => useSession("CUSTOMER"), { wrapper }).result.current,
    ).toBe(false);
  });

  it("updates after same-tab login and logout", async () => {
    const { result } = renderHook(() => useSession("CUSTOMER"), { wrapper });
    expect(result.current).toBe(false);

    saveAuthSession({
      access: "customer-token",
      refresh: "customer-refresh",
      role: "CUSTOMER",
    });
    await waitFor(() => expect(result.current).toBe(true));

    clearAuthSession();
    await waitFor(() => expect(result.current).toBe(false));
  });
});

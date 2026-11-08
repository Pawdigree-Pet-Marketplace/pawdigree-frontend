import { afterEach, describe, expect, it } from "vitest";
import {
  clearAuthSession,
  getSessionRole,
  getSessionToken,
  saveAuthSession,
} from "./authStorage";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("authStorage", () => {
  it("saves a consistent persistent session and preserves unrelated browser data", () => {
    localStorage.setItem("theme", "dark");
    sessionStorage.setItem("draft", "keep me");

    saveAuthSession({ access: "customer-access", refresh: "customer-refresh", role: "CUSTOMER" });

    expect(getSessionToken()).toBe("customer-access");
    expect(getSessionRole()).toBe("CUSTOMER");
    expect(localStorage.getItem("refresh")).toBe("customer-refresh");
    expect(localStorage.getItem("access_token")).toBe("customer-access");
    expect(sessionStorage.getItem("draft")).toBe("keep me");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("keeps a temporary session in sessionStorage and removes only auth keys", () => {
    localStorage.setItem("theme", "dark");
    saveAuthSession({ access: "vendor-access", refresh: "vendor-refresh", role: "VENDOR" });
    clearAuthSession();

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(getSessionRole()).toBeNull();
  });

});

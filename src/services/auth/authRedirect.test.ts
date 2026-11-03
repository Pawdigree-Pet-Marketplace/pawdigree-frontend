import { describe, expect, it } from "vitest";
import { getPostLoginPath } from "./authRedirect";

describe("getPostLoginPath", () => {
  it("preserves safe internal destinations and their query and hash", () => {
    expect(
      getPostLoginPath(
        { from: { pathname: "/pets", search: "?type=cat", hash: "#results" } },
        "CUSTOMER",
      ),
    ).toBe("/pets?type=cat#results");
  });

  it("uses the dashboard fallback when there is no destination", () => {
    expect(getPostLoginPath(null, "CUSTOMER")).toBe("/customer/dashboard");
    expect(getPostLoginPath({}, "VENDOR")).toBe("/vendor/dashboard");
  });

  it("rejects destinations owned by the other role", () => {
    expect(
      getPostLoginPath({ from: { pathname: "/vendor/documents" } }, "CUSTOMER"),
    ).toBe("/customer/dashboard");
    expect(
      getPostLoginPath({ from: { pathname: "/customer/adoption" } }, "VENDOR"),
    ).toBe("/vendor/dashboard");
  });

  it("rejects external, protocol-relative, malformed, and auth-loop destinations", () => {
    expect(getPostLoginPath({ from: "https://evil.example/path" }, "CUSTOMER")).toBe("/customer/dashboard");
    expect(getPostLoginPath({ from: "//evil.example/path" }, "CUSTOMER")).toBe("/customer/dashboard");
    expect(getPostLoginPath({ from: { pathname: "/verify-email" } }, "VENDOR")).toBe("/vendor/dashboard");
  });

  it.each([
    "/login",
    "/customer-login",
    "/vendor/login",
    "/vendor-login",
    "/verify-email",
    "/registration",
    "/vendor/register",
    "/vendor/register/business",
    "/vendor-registration",
    "/register.vendor",
    "/register.vendor/business",
    "/forgot-password",
    "/reset-password",
  ])("rejects auth-flow destination %s", (pathname) => {
    expect(getPostLoginPath({ from: { pathname } }, "VENDOR")).toBe(
      "/vendor/dashboard",
    );
  });
});

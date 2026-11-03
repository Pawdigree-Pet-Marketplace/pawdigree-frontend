import type { UserRole } from "./authStorage";

type RouteDestination = {
  pathname?: unknown;
  search?: unknown;
  hash?: unknown;
};

const fallbackByRole: Record<UserRole, string> = {
  CUSTOMER: "/customer/dashboard",
  VENDOR: "/vendor/dashboard",
};

const blockedPostLoginPaths = [
  "/login",
  "/customer-login",
  "/vendor/login",
  "/vendor-login",
  "/verify-email",
  "/registration",
  "/vendor-registration",
  "/forgot-password",
  "/reset-password",
];

function isBlockedPostLoginPath(pathname: string): boolean {
  return (
    blockedPostLoginPaths.includes(pathname) ||
    pathname === "/vendor/register" ||
    pathname.startsWith("/vendor/register/") ||
    pathname === "/register.vendor" ||
    pathname.startsWith("/register.vendor/")
  );
}

function isRoleSpecificPath(pathname: string, role: UserRole): boolean {
  const vendorPath =
    pathname === "/vendor" || pathname.startsWith("/vendor/") ||
    pathname === "/business-registration";
  const customerPath =
    pathname === "/customer" || pathname.startsWith("/customer/") ||
    pathname === "/pets" || pathname === "/adoption-request" ||
    pathname === "/profile" || pathname.startsWith("/profile/");

  return (role === "CUSTOMER" && vendorPath) || (role === "VENDOR" && customerPath);
}

function toInternalPath(destination: unknown): string | null {
  let pathname: unknown;
  let search = "";
  let hash = "";

  if (typeof destination === "string") {
    pathname = destination;
  } else if (destination && typeof destination === "object") {
    const route = destination as RouteDestination;
    pathname = route.pathname;
    search = typeof route.search === "string" ? route.search : "";
    hash = typeof route.hash === "string" ? route.hash : "";
  }

  const hasControlCharacter =
    typeof pathname === "string" &&
    Array.from(pathname).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\") ||
    hasControlCharacter ||
    (search && !search.startsWith("?")) ||
    (hash && !hash.startsWith("#"))
  ) {
    return null;
  }

  const path = `${pathname}${search}${hash}`;
  const parsed = new URL(path, "https://pawdigree.invalid");
  if (parsed.origin !== "https://pawdigree.invalid") return null;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function getPostLoginPath(state: unknown, role: UserRole): string {
  if (!state || typeof state !== "object") return fallbackByRole[role];

  const from = (state as { from?: unknown }).from;
  const path = toInternalPath(from);
  if (!path) return fallbackByRole[role];

  const pathname = new URL(path, "https://pawdigree.invalid").pathname;
  if (isBlockedPostLoginPath(pathname) || isRoleSpecificPath(pathname, role)) {
    return fallbackByRole[role];
  }

  return path;
}

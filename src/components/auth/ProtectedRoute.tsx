import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "../../services/auth/authStorage";
import { getSessionRole, getSessionToken } from "../../services/auth/authStorage";
import AccessDeniedPage from "../../pages/AccessDeniedPage";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";

type ProtectedRouteProps = {
  role: UserRole;
  children: ReactNode;
  requireVendorBusiness?: boolean;
};

type BusinessCheck = "loading" | "has-business" | "no-business" | "error";

export default function ProtectedRoute({
  role,
  children,
  requireVendorBusiness = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const token = getSessionToken();
  const currentRole = getSessionRole();
  const [businessCheck, setBusinessCheck] = useState<{ token: string; status: BusinessCheck } | null>(null);

  useEffect(() => {
    if (role !== "VENDOR" || !requireVendorBusiness || !token || currentRole !== role) return;

    let cancelled = false;
    vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not check your businesses.");
        const data = (await response.json()) as unknown[] | { results?: unknown[] };
        const businesses = Array.isArray(data) ? data : data.results;
        if (!businesses) throw new Error("Could not check your businesses.");
        if (!cancelled) setBusinessCheck({ token, status: businesses.length > 0 ? "has-business" : "no-business" });
      })
      .catch(() => {
        if (!cancelled) setBusinessCheck({ token, status: "error" });
      });

    return () => { cancelled = true; };
  }, [currentRole, requireVendorBusiness, role, token]);

  if (!token || !currentRole) {
    return <Navigate to={role === "VENDOR" ? "/vendor/login" : "/login"} replace state={{ from: location }} />;
  }

  if (currentRole !== role) {
    return <AccessDeniedPage />;
  }

  if (role === "VENDOR" && requireVendorBusiness) {
    const currentBusinessCheck = businessCheck?.token === token ? businessCheck.status : "loading";
    if (currentBusinessCheck === "loading") {
      return <div role="status" aria-live="polite">Checking your business registration…</div>;
    }
    if (currentBusinessCheck === "no-business") {
      return <Navigate to="/vendor/business-registration" replace state={{ from: location }} />;
    }
    if (currentBusinessCheck === "error") {
      return (
        <div role="alert">
          We couldn&apos;t verify your business registration. Please refresh the page or try again shortly.
        </div>
      );
    }
  }

  return children;
}

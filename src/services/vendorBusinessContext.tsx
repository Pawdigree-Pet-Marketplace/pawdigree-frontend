import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import API_BASE_URL from "./api";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";
import { VendorBusinessContext, type VendorBusiness } from "./vendorBusinessStore";

type LoadState =
  | { businessId: string; status: "loading" }
  | { businessId: string; status: "invalid" }
  | { businessId: string; status: "error" }
  | { businessId: string; status: "ready"; business: VendorBusiness };

export function VendorBusinessRoute({ children }: { children: ReactNode }) {
  const { businessId = "" } = useParams();
  const [state, setState] = useState<LoadState>({ businessId: "", status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const requestedBusinessId = businessId;
    vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/${encodeURIComponent(requestedBusinessId)}/`)
      .then(async (response) => {
        if (response.status === 403 || response.status === 404) {
          if (!cancelled) setState({ businessId: requestedBusinessId, status: "invalid" });
          return;
        }
        if (!response.ok) throw new Error("Could not validate this business.");
        const business = (await response.json()) as VendorBusiness;
        if (!cancelled) setState({ businessId: requestedBusinessId, status: "ready", business });
      })
      .catch(() => {
        if (!cancelled) setState({ businessId: requestedBusinessId, status: "error" });
      });
    return () => { cancelled = true; };
  }, [businessId]);

  if (state.businessId !== businessId) {
    return <div className="vendor-business-route-state" role="status">Loading business workspace…</div>;
  }
  if (state.status === "loading") {
    return <div className="vendor-business-route-state" role="status">Loading business workspace…</div>;
  }
  if (state.status === "invalid") return <Navigate to="/vendor/business-profile" replace />;
  if (state.status === "error") return <div className="vendor-business-route-state" role="alert">Could not load this business. Refresh the page or choose it again from Businesses.</div>;

  return (
    <VendorBusinessContext.Provider value={{ business: state.business }}>
      {children}
    </VendorBusinessContext.Provider>
  );
}

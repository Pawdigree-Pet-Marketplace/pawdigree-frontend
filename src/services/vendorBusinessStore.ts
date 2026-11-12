import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API_BASE_URL from "./api";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";

export interface VendorBusiness {
  id: string;
  name: string;
  description?: string;
  contact?: string;
  email?: string;
  address?: string;
  city_district?: string;
  business_hours?: Record<string, unknown>;
  business_type?: string | null;
  verification_status?: string;
  is_active?: boolean;
  logo?: string | null;
  cover_image?: string | null;
  [key: string]: unknown;
}

type ContextValue = { business: VendorBusiness };
export const VendorBusinessContext = createContext<ContextValue | null>(null);

export function useVendorBusiness(): VendorBusiness | null {
  return useContext(VendorBusinessContext)?.business ?? null;
}

export function useVendorBusinesses() {
  const [businesses, setBusinesses] = useState<VendorBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your businesses.");
        const data = (await response.json()) as VendorBusiness[] | { results?: VendorBusiness[] };
        const list = Array.isArray(data) ? data : data.results ?? [];
        if (!cancelled) setBusinesses(list);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load your businesses.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => ({ businesses, loading, error }), [businesses, loading, error]);
}

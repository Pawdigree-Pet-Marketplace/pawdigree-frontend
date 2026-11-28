import API_BASE_URL from "./api";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";

export type TransactionPage<T> = {
  count: number;
  results: T[];
  next: string | null;
};

export type VendorTransactionCustomer = { id: number; name: string };

export type VendorSale = {
  id: number;
  order_id: number | string;
  business_id: string;
  business_name: string;
  status: string;
  created_at: string;
  total: string;
  customer: VendorTransactionCustomer;
  refund_status: string;
  refund_amount: string;
  sale_state?: "PAID" | "RESERVED";
};

export type VendorBookingActivity = {
  booking_id: number;
  business_id: string;
  business_name: string;
  service_name: string;
  customer: VendorTransactionCustomer;
  start_at: string;
  end_at: string;
  status: string;
  created_at: string;
};

async function transactionPage<T>(path: string, status?: string): Promise<TransactionPage<T>> {
  const query = new URLSearchParams({ page_size: "5" });
  if (status) query.set("status", status);
  const response = await vendorAuthenticatedFetch(
    new URL(`/api/vendor/transactions/${path}/?${query}`, API_BASE_URL || window.location.origin),
  );
  if (!response.ok) throw new Error(`Transaction request failed (${response.status}).`);
  const data = await response.json() as Partial<TransactionPage<T>>;
  if (!Array.isArray(data.results)) throw new Error("The server returned an unexpected transaction response.");
  return { count: Number(data.count ?? 0), results: data.results, next: data.next ?? null };
}

export const fetchVendorDashboardOrders = () => transactionPage<VendorSale>("orders");
export const fetchVendorDashboardPetSales = (status?: string) => transactionPage<VendorSale>("pet-sales", status);
export const fetchVendorDashboardBookings = (status?: string) => transactionPage<VendorBookingActivity>("bookings", status);

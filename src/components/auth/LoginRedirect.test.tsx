import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, type InitialEntry } from "react-router-dom";
import CustomerLoginForm from "./CustomerLoginForm";
import VendorLoginPage from "../../pages/Vendor/VendorLoginPage";

const { apiRequestMock, vendorFetchMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn(), vendorFetchMock: vi.fn() }));

vi.mock("../../services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/api")>()),
  apiRequest: apiRequestMock,
}));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch: vendorFetchMock }));
vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (result: { credential: string }) => void }) => (
    <button type="button" onClick={() => onSuccess({ credential: "google-credential" })}>
      Mock Google login
    </button>
  ),
}));

function renderLogin(entry: InitialEntry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<CustomerLoginForm />} />
        <Route path="/vendor/login" element={<VendorLoginPage />} />
        <Route path="/customer/dashboard" element={<p>Customer dashboard destination</p>} />
        <Route path="/vendor/dashboard" element={<p>Vendor dashboard destination</p>} />
        <Route path="/pets" element={<p>Customer pets destination</p>} />
        <Route path="/customer/cart" element={<p>Customer cart destination</p>} />
        <Route path="/customer/checkout" element={<p>Customer checkout destination</p>} />
        <Route path="/vendor/documents" element={<p>Vendor documents destination</p>} />
        <Route path="/verify-email" element={<p>Verification destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitCustomerLogin() {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "person@example.com" } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "secret123" } });
  fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
}

async function submitVendorLogin() {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "person@example.com" } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "secret123" } });
  fireEvent.click(screen.getByRole("button", { name: /sign in to your store/i }));
}

afterEach(() => {
  cleanup();
  apiRequestMock.mockReset();
  vendorFetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => [{ id: "business-1" }] });
  localStorage.clear();
  sessionStorage.clear();
});

describe("login destination handling", () => {
  it("returns a customer to the requested page and falls back for direct login", async () => {
    apiRequestMock.mockResolvedValue({ access: "customer-token", refresh: "customer-refresh" });
    renderLogin({ pathname: "/login", state: { from: { pathname: "/pets" } } });
    await submitCustomerLogin();
    expect(await screen.findByText("Customer pets destination")).toBeInTheDocument();

    cleanup();
    apiRequestMock.mockResolvedValue({ access: "customer-token", refresh: "customer-refresh" });
    renderLogin("/login");
    await submitCustomerLogin();
    expect(await screen.findByText("Customer dashboard destination")).toBeInTheDocument();
  });

  it.each([
    ["/customer/cart", "Customer cart destination"],
    ["/customer/checkout", "Customer checkout destination"],
  ])("returns a customer to %s after login", async (destination, text) => {
    apiRequestMock.mockResolvedValue({ access: "customer-token", refresh: "customer-refresh" });
    renderLogin({ pathname: "/login", state: { from: { pathname: destination } } });
    await submitCustomerLogin();
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("keeps customer login within customer paths and applies the rule to Google login", async () => {
    apiRequestMock.mockResolvedValue({ access: "customer-token", refresh: "customer-refresh" });
    renderLogin({ pathname: "/login", state: { from: { pathname: "/vendor/documents" } } });
    await submitCustomerLogin();
    expect(await screen.findByText("Customer dashboard destination")).toBeInTheDocument();

    cleanup();
    apiRequestMock.mockResolvedValue({ access: "google-token", refresh: "google-refresh" });
    renderLogin({ pathname: "/login", state: { from: { pathname: "/pets" } } });
    fireEvent.click(screen.getByRole("button", { name: /mock google login/i }));
    expect(await screen.findByText("Customer pets destination")).toBeInTheDocument();
  });

  it("returns a vendor to the requested page and falls back for direct login", async () => {
    apiRequestMock.mockResolvedValue({ access: "vendor-token", refresh: "vendor-refresh" });
    renderLogin({ pathname: "/vendor/login", state: { from: { pathname: "/vendor/documents" } } });
    await submitVendorLogin();
    expect(await screen.findByText("Vendor documents destination")).toBeInTheDocument();

    cleanup();
    apiRequestMock.mockResolvedValue({ access: "vendor-token", refresh: "vendor-refresh" });
    renderLogin("/vendor/login");
    await submitVendorLogin();
    expect(await screen.findByText("Vendor dashboard destination")).toBeInTheDocument();
  });

  it("keeps vendor login within vendor paths", async () => {
    apiRequestMock.mockResolvedValue({ access: "vendor-token", refresh: "vendor-refresh" });
    renderLogin({ pathname: "/vendor/login", state: { from: { pathname: "/customer/dashboard" } } });
    await submitVendorLogin();
    expect(await screen.findByText("Vendor dashboard destination")).toBeInTheDocument();
  });

  it("carries the customer destination to email verification without saving tokens", async () => {
    apiRequestMock.mockResolvedValue({ verification_required: true, verification_token: "verification-token" });
    renderLogin({ pathname: "/login", state: { from: { pathname: "/pets" } } });
    await submitCustomerLogin();
    await waitFor(() => expect(screen.getByText("Verification destination")).toBeInTheDocument());

    expect(JSON.parse(sessionStorage.getItem("pawdigree_email_verification") ?? "{}").redirectTo).toBe("/pets");
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});

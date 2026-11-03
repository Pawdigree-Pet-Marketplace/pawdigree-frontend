import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VerifyEmailPage from "./VerifyEmailPage";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));
vi.mock("../services/api", () => ({ apiRequest: apiRequestMock }));

function renderVerification(role: "CUSTOMER" | "VENDOR", redirectTo: string) {
  sessionStorage.setItem(
    "pawdigree_email_verification",
    JSON.stringify({
      verificationToken: "verification-token",
      email: "person@example.com",
      role,
      redirectTo,
      keepLoggedIn: true,
      expiresAt: Date.now() + 600_000,
      resendAt: Date.now() + 60_000,
    }),
  );

  return render(
    <MemoryRouter initialEntries={["/verify-email"]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/pets" element={<p>Customer pets destination</p>} />
        <Route path="/vendor/documents" element={<p>Vendor documents destination</p>} />
        <Route path="/customer/dashboard" element={<p>Customer dashboard destination</p>} />
        <Route path="/vendor/dashboard" element={<p>Vendor dashboard destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function verify() {
  fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: /verify email and log in/i }));
}

afterEach(() => {
  cleanup();
  apiRequestMock.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});

describe("email verification destination", () => {
  it("returns a verified customer to the intended page", async () => {
    apiRequestMock.mockResolvedValue({ access: "customer-token", refresh: "customer-refresh" });
    renderVerification("CUSTOMER", "/pets");
    await verify();

    expect(await screen.findByText("Customer pets destination")).toBeInTheDocument();
  });

  it("returns a verified vendor to the intended page", async () => {
    apiRequestMock.mockResolvedValue({ access: "vendor-token", refresh: "vendor-refresh" });
    renderVerification("VENDOR", "/vendor/documents");
    await verify();

    expect(await screen.findByText("Vendor documents destination")).toBeInTheDocument();
  });

  it("uses the role dashboard when a stored destination crosses role boundaries", async () => {
    apiRequestMock.mockResolvedValue({ access: "vendor-token", refresh: "vendor-refresh" });
    renderVerification("VENDOR", "/customer/dashboard");
    await verify();

    expect(await screen.findByText("Vendor dashboard destination")).toBeInTheDocument();
  });
});

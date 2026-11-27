import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

function renderRoute(role?: "CUSTOMER" | "VENDOR", path = "/vendor/documents") {
  if (role) {
    const storage = role === "CUSTOMER" ? sessionStorage : localStorage;
    storage.setItem("token", `${role.toLowerCase()}-token`);
    storage.setItem("refresh", "refresh-token");
    storage.setItem("role", role);
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/vendor/documents" element={<ProtectedRoute role="VENDOR"><p>Vendor documents</p></ProtectedRoute>} />
        <Route path="/customer/dashboard" element={<ProtectedRoute role="CUSTOMER"><p>Customer dashboard</p></ProtectedRoute>} />
        <Route path="/customer/private" element={<ProtectedRoute role="CUSTOMER"><p>Customer private page</p></ProtectedRoute>} />
        <Route path="/customer/my-requests" element={<ProtectedRoute role="CUSTOMER"><p>Customer adoption requests</p></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<p>Vendor dashboard</p>} />
        <Route path="/login" element={<p>Customer login</p>} />
        <Route path="/vendor/login" element={<p>Vendor login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated visitors to the vendor login page for vendor routes", () => {
    renderRoute();
    expect(screen.getByText("Vendor login")).toBeInTheDocument();
  });

  it("redirects unauthenticated visitors to the customer login page for customer routes", () => {
    renderRoute(undefined, "/customer/dashboard");
    expect(screen.getByText("Customer login")).toBeInTheDocument();
  });

  it("redirects unauthenticated visitors from customer adoption requests to customer login", () => {
    renderRoute(undefined, "/customer/my-requests");
    expect(screen.getByText("Customer login")).toBeInTheDocument();
  });

  it("shows access denied when a customer tries to access a vendor route", () => {
    renderRoute("CUSTOMER");
    expect(screen.getByRole("heading", { name: /you can’t access this page/i })).toBeInTheDocument();
    expect(screen.queryByText("Customer dashboard")).not.toBeInTheDocument();
  });

  it("allows a vendor to access vendor routes", () => {
    renderRoute("VENDOR");
    expect(screen.getByText("Vendor documents")).toBeInTheDocument();
  });

  it("shows access denied when a vendor tries to access a customer route", () => {
    renderRoute("VENDOR", "/customer/private");
    expect(screen.getByRole("heading", { name: /you can’t access this page/i })).toBeInTheDocument();
    expect(screen.queryByText("Vendor dashboard")).not.toBeInTheDocument();
  });

  it("denies vendors access to customer adoption requests", () => {
    renderRoute("VENDOR", "/customer/my-requests");
    expect(screen.getByRole("heading", { name: /you can’t access this page/i })).toBeInTheDocument();
    expect(screen.queryByText("Customer adoption requests")).not.toBeInTheDocument();
  });

  it("preserves the checkout destination when redirecting an anonymous visitor to login", () => {
    function DestinationProbe() {
      const location = useLocation();
      return <output data-testid="protected-destination">{JSON.stringify(location.state)}</output>;
    }

    render(
      <MemoryRouter initialEntries={["/customer/checkout"]}>
        <Routes>
          <Route path="/customer/checkout" element={<ProtectedRoute role="CUSTOMER"><p>Checkout</p></ProtectedRoute>} />
          <Route path="/login" element={<DestinationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("protected-destination")).toHaveTextContent('"pathname":"/customer/checkout"');
  });
});

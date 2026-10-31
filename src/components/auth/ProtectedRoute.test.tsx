import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

afterEach(() => {
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
        <Route path="/vendor/dashboard" element={<p>Vendor dashboard</p>} />
        <Route path="/vendor/login" element={<p>Vendor login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated visitors to the matching login page", () => {
    renderRoute();
    expect(screen.getByText("Vendor login")).toBeInTheDocument();
  });

  it("redirects customers away from vendor routes to their dashboard", () => {
    renderRoute("CUSTOMER");
    expect(screen.getByText("Customer dashboard")).toBeInTheDocument();
  });

  it("allows a vendor to access vendor routes", () => {
    renderRoute("VENDOR");
    expect(screen.getByText("Vendor documents")).toBeInTheDocument();
  });

  it("redirects vendors away from customer routes to their dashboard", () => {
    renderRoute("VENDOR", "/customer/dashboard");
    expect(screen.getByText("Vendor dashboard")).toBeInTheDocument();
  });
});

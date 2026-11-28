import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import VendorDashboardTour from "./VendorDashboardTour";

const targetNames = ["overview", "businesses", "recent-orders", "recent-bookings", "messages", "reviews", "notifications", "profile"];
const targetSteps = [
  { title: "Welcome to Your Dashboard" },
  { title: "My Businesses", target: "businesses" },
  { title: "Dashboard Statistics", target: "overview" },
  { title: "Recent Orders", target: "recent-orders" },
  { title: "Recent Bookings", target: "recent-bookings" },
  { title: "Customer Messages", target: "messages" },
  { title: "Recent Reviews", target: "reviews" },
  { title: "Notifications", target: "notifications" },
  { title: "My Profile", target: "profile" },
];

function renderTour(path = "/vendor/dashboard", vendorId = "vendor-1") {
  return render(<MemoryRouter initialEntries={[path]}><main>
    {targetNames.map((target) => <div key={target} data-vendor-tour={target} />)}
    <VendorDashboardTour vendorId={vendorId} />
  </main></MemoryRouter>);
}

function renderDashboardRoutes() {
  return render(<MemoryRouter initialEntries={["/vendor/dashboard"]}><Routes>
    <Route path="/vendor/dashboard" element={<main>
      {targetNames.map((target) => <div key={target} data-vendor-tour={target} />)}
      <Link to="/vendor/business/42/dashboard">Open business dashboard</Link>
      <VendorDashboardTour vendorId="vendor-1" />
    </main>} />
    <Route path="/vendor/business/:businessId/dashboard" element={<main><h1>Business dashboard</h1><Link to="/vendor/dashboard">Return to main dashboard</Link></main>} />
  </Routes></MemoryRouter>);
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) } as DOMRect;
}

describe("VendorDashboardTour", () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => cleanup());

  it("starts for a new vendor once their vendor id is available", async () => {
    const { rerender } = render(<MemoryRouter><main><VendorDashboardTour vendorId="" /></main></MemoryRouter>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<MemoryRouter><main><VendorDashboardTour vendorId="vendor-1" /></main></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Welcome to Your Dashboard" })).toBeInTheDocument();
  });

  it("uses the nine main dashboard steps in the requested order", async () => {
    const user = userEvent.setup();
    renderTour();
    for (let index = 0; index < targetSteps.length; index += 1) {
      const step = targetSteps[index];
      expect(await screen.findByRole("heading", { name: step.title })).toBeInTheDocument();
      expect(screen.getByText(`Step ${index + 1} of 9`)).toBeInTheDocument();
      if (step.title === "Customer Messages") expect(screen.getByText(/general conversations are not available yet/i)).toBeInTheDocument();
      if (step.title === "Recent Reviews") expect(screen.getByText(/vendor-wide review feed is not available yet/i)).toBeInTheDocument();
      if (step.target) expect(document.querySelector(`[data-vendor-tour="${step.target}"]`)).toHaveClass("vendor-tour-highlight");
      if (index < targetSteps.length - 1) await user.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
  });

  it("supports Back, Skip, persistence for returning vendors, and replay", async () => {
    const user = userEvent.setup();
    renderTour();
    await user.click(await screen.findByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Welcome to Your Dashboard" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(localStorage.getItem("pawdigree:vendor-dashboard-tour:vendor-1")).toBe("complete");

    cleanup();
    renderTour();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    cleanup();
    renderTour("/vendor/dashboard?tour=replay");
    expect(await screen.findByRole("heading", { name: "Welcome to Your Dashboard" })).toBeInTheDocument();
  });

  it("completes and persists when the vendor finishes the last step", async () => {
    const user = userEvent.setup();
    renderTour();
    for (let index = 0; index < targetSteps.length - 1; index += 1) {
      await user.click(await screen.findByRole("button", { name: "Next" }));
    }
    expect(await screen.findByRole("button", { name: "Finish" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("pawdigree:vendor-dashboard-tour:vendor-1")).toBe("complete");
  });

  it("mounts only on the main dashboard while navigating into and back from a business dashboard", async () => {
    const user = userEvent.setup();
    renderDashboardRoutes();
    expect(await screen.findByRole("heading", { name: "Welcome to Your Dashboard" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Open business dashboard" }));
    expect(await screen.findByRole("heading", { name: "Business dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Return to main dashboard" }));
    expect(await screen.findByRole("heading", { name: "Welcome to Your Dashboard" })).toBeInTheDocument();
  });

  it.each([
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ])("keeps every highlighted step positioned in the $name viewport", async ({ width, height }) => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    const sectionRects: Record<string, DOMRect> = {};
    targetNames.forEach((target, index) => {
      const sidebar = target === "notifications" || target === "profile";
      sectionRects[target] = width > 500
        ? sidebar ? rect(30, 240 + index * 80, 220, 42) : rect(300, 160 + index * 75, 900, 100)
        : sidebar ? rect(12, 240 + index * 45, 160, 40) : rect(16, 100 + index * 70, 358, 100);
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const target = this.getAttribute("data-vendor-tour");
      if (target && sectionRects[target]) return sectionRects[target];
      if (this.classList.contains("vendor-tour-card")) return rect(0, 0, 320, 190);
      return rect(0, 0, 0, 0);
    });

    renderTour();
    for (const step of targetSteps) {
      expect(await screen.findByRole("heading", { name: step.title })).toBeInTheDocument();
      const card = screen.getByRole("dialog");
      if (step.target) {
        const target = document.querySelector(`[data-vendor-tour="${step.target}"]`);
        expect(target).toHaveClass("vendor-tour-highlight");
        await waitFor(() => {
          const top = Number.parseFloat(card.style.top);
          const left = Number.parseFloat(card.style.left);
          expect(top).toBeGreaterThanOrEqual(16);
          expect(left).toBeGreaterThanOrEqual(16);
          expect(top + 190).toBeLessThanOrEqual(height - 16);
          expect(left + 320).toBeLessThanOrEqual(width - 16);
        });
      }
      if (step !== targetSteps[targetSteps.length - 1]) await user.click(screen.getByRole("button", { name: "Next" }));
    }
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import VendorDashboardTour from "./VendorDashboardTour";

function renderTour(path = "/vendor/dashboard") {
  return render(<MemoryRouter initialEntries={[path]}><main>
    <div data-vendor-tour="overview" />
    <div data-vendor-tour="businesses" />
    <div data-vendor-tour="merchandise" />
    <div data-vendor-tour="pets" />
    <div data-vendor-tour="services" />
    <div data-vendor-tour="orders-navigation" />
    <div data-vendor-tour="sales" />
    <VendorDashboardTour vendorId="vendor-1" businessTypes={["PRODUCT_SELLER", "PET_SALE_ADOPTION", "SERVICE_PROVIDER"]} />
  </main></MemoryRouter>);
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) } as DOMRect;
}

describe("VendorDashboardTour", () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => cleanup());

  it("starts on the welcome step and advances through the dashboard overview", async () => {
    const user = userEvent.setup();
    renderTour();
    expect(await screen.findByRole("heading", { name: "Welcome to Pawdigree" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("heading", { name: "Dashboard overview" })).toBeInTheDocument();
  });

  it("remembers a skipped tour and can replay it from the dashboard URL", async () => {
    const user = userEvent.setup();
    renderTour();
    await user.click(await screen.findByRole("button", { name: "Skip tour" }));
    expect(localStorage.getItem("pawdigree:vendor-dashboard-tour:vendor-1")).toBe("complete");
    cleanup();
    renderTour("/vendor/dashboard?tour=replay");
    expect(await screen.findByRole("heading", { name: "Welcome to Pawdigree" })).toBeInTheDocument();
  });

  it.each([
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ])("keeps all eight $name tour steps next to their targets and in view", async ({ width, height }) => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    const targetRects: Record<string, DOMRect> = width > 500 ? {
      overview: rect(300, 180, 900, 150), businesses: rect(300, 550, 900, 130), merchandise: rect(300, 280, 900, 160),
      pets: rect(30, 240, 210, 42), services: rect(30, 500, 220, 42), "orders-navigation": rect(30, 380, 230, 42), sales: rect(300, 500, 400, 180),
    } : {
      overview: rect(16, 100, 358, 320), businesses: rect(16, 350, 358, 190), merchandise: rect(16, 360, 358, 180),
      pets: rect(12, 260, 160, 40), services: rect(12, 600, 160, 40), "orders-navigation": rect(12, 450, 160, 40), sales: rect(16, 200, 358, 240),
    };
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const target = this.getAttribute("data-vendor-tour");
      if (target && targetRects[target]) return targetRects[target];
      if (this.classList.contains("vendor-tour-card")) return rect(0, 0, 320, 190);
      return rect(0, 0, 0, 0);
    });

    renderTour();
    const steps = [
      { title: "Welcome to Pawdigree" },
      { title: "Dashboard overview", target: "overview" },
      { title: "My Businesses", target: "businesses" },
      { title: "Merchandise", target: "merchandise" },
      { title: "Pet listings", target: "pets" },
      { title: "Services", target: "services" },
      { title: "Orders and bookings", target: "orders-navigation" },
      { title: "Sales and payouts", target: "sales" },
    ];

    for (const [index, step] of steps.entries()) {
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
        if (step.target === "overview") {
          const originalTop = card.style.top;
          targetRects.overview = rect(16, 480, Math.min(358, width - 32), 120);
          fireEvent.scroll(window);
          await waitFor(() => expect(card.style.top).not.toBe(originalTop));
          fireEvent.resize(window);
          expect(scrollIntoView).toHaveBeenCalled();
        }
      }
      if (index < steps.length - 1) await user.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
  });
});

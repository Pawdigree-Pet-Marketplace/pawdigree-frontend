import { cleanup, render as rtlRender, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VendorAddServicePage from "../pages/Vendor/VendorAddServicePage";

vi.mock("../layouts/VendorLayout/VendorLayout", () => ({
  default: ({
    children,
    title,
    description,
  }: {
    children: ReactNode;
    title: string;
    description: string;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  ),
}));

const render = (ui: React.ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe("VendorAddServicePage", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-vendor-token");
    localStorage.setItem("role", "VENDOR");
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("shows the service fields and says service saving is not available", () => {
    render(<VendorAddServicePage />);

    expect(screen.getByRole("heading", { name: "Add a service" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /service name/i })).toBeRequired();
    expect(screen.getByRole("textbox", { name: /description/i })).toBeRequired();
    expect(screen.getByRole("spinbutton", { name: /price \(ugx\)/i })).toBeRequired();
    expect(screen.getByRole("spinbutton", { name: /duration \(minutes\)/i })).toBeRequired();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Saving services isn’t available just yet. Once setup is complete, you’ll be able to publish your service for customers to find.",
    );
    expect(screen.getByRole("button", { name: /save service/i })).toBeDisabled();
  });

  it("validates required fields and positive whole-number price and duration", async () => {
    const user = userEvent.setup();
    render(<VendorAddServicePage />);
    const form = document.querySelector("form");
    const name = screen.getByRole("textbox", { name: /service name/i });
    const description = screen.getByRole("textbox", { name: /description/i });
    const price = screen.getByRole("spinbutton", { name: /price \(ugx\)/i });
    const duration = screen.getByRole("spinbutton", { name: /duration \(minutes\)/i });

    expect(form).not.toBeNull();
    expect(form).not.toBeValid();

    await user.type(name, "Dog grooming");
    await user.type(description, "Bath, brush and nail trim.");
    await user.type(price, "50000");
    await user.type(duration, "60");
    expect(form).toBeValid();

    await user.clear(price);
    await user.type(price, "0");
    expect(price).toBeInvalid();
    await user.clear(price);
    await user.type(price, "50.5");
    expect(price).toBeInvalid();

    await user.clear(price);
    await user.type(price, "50000");
    await user.clear(duration);
    await user.type(duration, "0");
    expect(duration).toBeInvalid();
  });
});

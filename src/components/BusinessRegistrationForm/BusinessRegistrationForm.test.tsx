
import { render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import BusinessRegistrationForm from "./BusinessRegistrationForm";

const mockCategories = [
  { id: 1, name: "Pet shop" },
  { id: 2, name: "Veterinary clinic" },
];

describe("Business Registration Form", () => {
  beforeEach(() => {
    localStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCategories,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("renders the business registration heading", () => {
    render(<BusinessRegistrationForm />);

    expect(
      screen.getByRole("heading", {
        name: "Register Your Business",
      }),
    ).toBeInTheDocument();
  });

  test("loads categories from the backend", async () => {
    render(<BusinessRegistrationForm />);

    expect(
      await screen.findByRole("option", { name: "Pet shop" }),
    ).toHaveValue("1");

    expect(
      screen.getByRole("option", { name: "Veterinary clinic" }),
    ).toHaveValue("2");
  });

  test("shows an error for an invalid email address", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.type(
      screen.getByLabelText(/business email/i),
      "invalid-email",
    );

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
  });

  test("requires the business description", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByText("Business description is required."),
    ).toBeInTheDocument();
  });

  test("requires a city or district", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByText("City or district is required."),
    ).toBeInTheDocument();
  });

  test("requires vendor login before submitting a business", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.type(
      screen.getByLabelText(/business name/i),
      "Happy Paws",
    );

    await user.type(
      screen.getByLabelText(/business description/i),
      "Pet supplies and accessories",
    );

    await user.selectOptions(
      screen.getByLabelText(/business category/i),
      "1",
    );

    await user.type(
      screen.getByLabelText(/business address/i),
      "Kampala Road",
    );

    await user.type(
      screen.getByLabelText(/city or district/i),
      "Kampala",
    );

    await user.type(
      screen.getByLabelText(/business phone/i),
      "+256700123456",
    );

    await user.type(
      screen.getByLabelText(/business email/i),
      "happy@example.com",
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: /terms and conditions/i,
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/please log in before registering your business/i);

    // Only the public categories request should have been sent.
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("shows an error if categories cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("fetch failed")),
    );

    render(<BusinessRegistrationForm />);

    expect(await screen.findByText("fetch failed")).toBeInTheDocument();
  });
});

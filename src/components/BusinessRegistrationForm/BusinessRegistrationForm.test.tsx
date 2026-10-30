
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BusinessRegistrationForm from "./BusinessRegistrationForm";

const mockCategories = [
  { id: 1, name: "Pet shop" },
  { id: 2, name: "Veterinary clinic" },
];

const mockCountryCodes = [
  {
    name: "Uganda",
    code: "UG",
    dial_code: "+256",
  },
];

function mockFetchSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/categories/")) {
        return {
          ok: true,
          json: async () => mockCategories,
        };
      }
  

      if (url.includes("/api/country-codes/")) {
        return {
          ok: true,
          json: async () => mockCountryCodes,
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    }),
  );
}

async function fillField(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  value: string,
) {
  await user.type(screen.getByLabelText(label), value);
}

async function goToStepTwo(
  user: ReturnType<typeof userEvent.setup>,
) {
  await fillField(user, /business name/i, "Happy Paws");
  await fillField(user, /description/i, "Pet products and care");

  await user.selectOptions(
    screen.getByLabelText(/business category/i),
    "1",
  );

  await user.click(
    screen.getAllByRole("button", {
      name: /continue|next/i,
    })[0],
  );
}

async function goToStepThree(
  user: ReturnType<typeof userEvent.setup>,
) {
  await goToStepTwo(user);

    await fillField(
    user,
    /^Business address$/i,
    "Kampala Road",
  );

  await fillField(
    user,
    /business email|email/i,
    "happy@example.com",
  );

  await fillField(user, /^Business phone$/i, "+256712345678");

  const locationField = screen.queryByLabelText(/district/i);

  if (locationField) {
    await user.type(locationField, "Kampala");
  }

  await user.click(
    screen.getAllByRole("button", {
      name: /continue|next/i,
    })[0],
  );
}

describe("Business Registration Form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetchSuccess();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the business registration heading", () => {
    render(<BusinessRegistrationForm />);

    expect(
      screen.getByRole("heading", {
        name: /register your business/i,
      }),
    ).toBeInTheDocument();
  });

  it("loads business categories from the backend", async () => {
    render(<BusinessRegistrationForm />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/categories/"),
        expect.anything(),
      );
    });

    expect(await screen.findByText(/pet shop/i)).toBeInTheDocument();
  });

  it("requires the business description on step one", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    const description = screen.getByLabelText(/description/i);

    await user.click(
      screen.getAllByRole("button", {
        name: /continue|next/i,
      })[0],
    );

    expect(description).toHaveAttribute("aria-invalid", "true");
  });

  it("does not advance when step one has missing required fields", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.click(
      screen.getAllByRole("button", {
        name: /continue|next/i,
      })[0],
    );

    expect(
      screen.getByRole("heading", {
        name: /register your business/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("validates an invalid business email on step two", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await goToStepTwo(user);

    const emailField = screen.getByLabelText(
      /business email|email/i,
    );

    await user.clear(emailField);
    await user.type(emailField, "not-an-email");

    await user.click(
      screen.getAllByRole("button", {
        name: /continue|next/i,
      })[0],
    );

    expect(emailField).toHaveAttribute("aria-invalid", "true");
  });

  it("requires a city or district on step two", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await goToStepTwo(user);

    const locationField = screen.getByLabelText(/district/i);

    await user.click(
      screen.getAllByRole("button", {
        name: /continue|next/i,
      })[0],
    );

    expect(locationField).toHaveAttribute("aria-invalid", "true");
  });

  it("requires agreement to the terms on step three", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await goToStepThree(user);

    const termsCheckbox = screen.getByRole("checkbox", {
      name: /terms and conditions/i,
    });

    expect(termsCheckbox).not.toBeChecked();

    await user.click(
      screen.getAllByRole("button", {
        name: /register business/i,
      })[1],
    );

    expect(termsCheckbox).toHaveAttribute("aria-invalid", "true");
  });

  it("requires vendor login before submitting a business", async () => {
    const user = userEvent.setup();

    localStorage.clear();

    render(<BusinessRegistrationForm />);

    await goToStepThree(user);

    const termsCheckbox = screen.getByRole("checkbox", {
      name: /terms and conditions/i,
    });

    await user.click(termsCheckbox);

    expect(termsCheckbox).toBeChecked();

    await user.click(
      screen.getAllByRole("button", {
        name: /register business/i,
      })[1],
    );

    // Registration must not be submitted without a login token.
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/businesses/"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("shows an error if categories cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/categories/")) {
          throw new Error("fetch failed");
        }

        return {
          ok: true,
          json: async () => mockCountryCodes,
        };
      }),
    );

    render(<BusinessRegistrationForm />);

    expect(
      await screen.findByText(/fetch failed/i),
    ).toBeInTheDocument();
  });

});

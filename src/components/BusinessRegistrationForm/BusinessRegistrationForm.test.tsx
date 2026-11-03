
import type { ReactNode } from "react";

import {
  cleanup,
  render as rtlRender,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import BusinessRegistrationForm from "./BusinessRegistrationForm";

const render = (ui: ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

const mockCountryCodes = [
  {
    country: "Uganda",
    iso_code: "UG",
    dial_code: "+256",
  },
];

function mockFetchSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

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

  await fillField(
    user,
    /business description/i,
    "Pet products and care",
  );

  await user.click(
    screen.getByRole("button", {
      name: /continue/i,
    }),
  );
}

async function goToStepThree(
  user: ReturnType<typeof userEvent.setup>,
) {
  await goToStepTwo(user);

  await fillField(
    user,
    /^business address$/i,
    "Kampala Road",
  );

  await fillField(
    user,
    /^city or district$/i,
    "Kampala",
  );

  await fillField(
    user,
    /business email/i,
    "happy@example.com",
  );

  await fillField(
    user,
    /business phone/i,
    "+256712345678",
  );

  await user.click(
    screen.getByRole("button", {
      name: /continue/i,
    }),
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

  it("does not display a business category field", () => {
    render(<BusinessRegistrationForm />);

    expect(
      screen.queryByLabelText(/business category/i),
    ).not.toBeInTheDocument();
  });

  it("does not display an extra navigation button above the business name", () => {
    render(<BusinessRegistrationForm />);

    const businessName = screen.getByLabelText(/business name/i);

    const continueButton = screen.getByRole("button", {
      name: /continue/i,
    });

    expect(businessName).toBeInTheDocument();
    expect(continueButton).toBeInTheDocument();

    // Only one Continue button should exist on step one.
    expect(
      screen.getAllByRole("button", {
        name: /continue/i,
      }),
    ).toHaveLength(1);
  });

  it("loads phone country codes from the backend", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    // Wait for the country-code API request.
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/country-codes/"),
        expect.anything(),
      );
    });

    // Complete Step 1 to reveal the phone country dropdown on Step 2.
    await goToStepTwo(user);

    // Confirm that Uganda is available in the dropdown.
    expect(
      await screen.findByRole("option", {
        name: /uganda/i,
      }),
    ).toBeInTheDocument();
  });

  it("requires the business name on step one", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.type(
      screen.getByLabelText(/business description/i),
      "Pet products and care",
    );

    await user.click(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    );

    expect(
      screen.getByLabelText(/business name/i),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("requires the business description on step one", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.type(
      screen.getByLabelText(/business name/i),
      "Happy Paws",
    );

    await user.click(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    );

    expect(
      screen.getByLabelText(/business description/i),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("does not advance when step one has missing required fields", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await user.click(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    );

    expect(
      screen.getByLabelText(/business name/i),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/business description/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText(/^business address$/i),
    ).not.toBeInTheDocument();
  });

  it("advances to step two when step one is valid", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await goToStepTwo(user);

    expect(
      screen.getByLabelText(/^business address$/i),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/business phone/i),
    ).toBeInTheDocument();
  });

  it("validates an invalid business email on step two", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await goToStepTwo(user);

    await fillField(
      user,
      /^business address$/i,
      "Kampala Road",
    );

    await fillField(
      user,
      /^city or district$/i,
      "Kampala",
    );

    await fillField(
      user,
      /business phone/i,
      "+256712345678",
    );

    await fillField(
      user,
      /business email/i,
      "not-an-email",
    );

    await user.click(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    );

    expect(
      screen.getByLabelText(/business email/i),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("requires a city or district on step two", async () => {
    const user = userEvent.setup();

    render(<BusinessRegistrationForm />);

    await goToStepTwo(user);

    await fillField(
      user,
      /^business address$/i,
      "Kampala Road",
    );

    await fillField(
      user,
      /business phone/i,
      "+256712345678",
    );

    await fillField(
      user,
      /business email/i,
      "happy@example.com",
    );

    await user.click(
      screen.getByRole("button", {
        name: /continue/i,
      }),
    );

    expect(
      screen.getByLabelText(/^city or district$/i),
    ).toHaveAttribute("aria-invalid", "true");
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
      screen.getByRole("button", {
        name: /register business/i,
      }),
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
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByText(/please log in before registering/i),
    ).toBeInTheDocument();

    // Registration must not be submitted without a login token.
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/businesses/register/"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("shows an error if phone country codes cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("fetch failed");
      }),
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<BusinessRegistrationForm />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Unable to load phone country codes:",
        expect.any(Error),
      );
    });

    consoleError.mockRestore();
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import VendorRegistrationForm from "./VendorRegistrationForm";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  apiRequest: apiRequestMock,
}));

const countries = [
  { country: "Uganda", iso_code: "UG", dial_code: "+256" },
  { country: "Kenya", iso_code: "KE", dial_code: "+254" },
  { country: "Tanzania", iso_code: "TZ", dial_code: "+255" },
];

function changeField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  });
}

function fillPersonalDetails() {
  changeField(/^First name/i, "Jane");
  changeField(/^Last name/i, "Namara");
  changeField(/^Username/i, "@janenamara");
}

async function goToContactDetails() {
  fillPersonalDetails();

  fireEvent.click(screen.getByRole("button", { name: "Continue" }));

  await screen.findByRole("heading", { name: "Contact details" });
}

function fillContactDetails(
  email = "jane@example.com",
  phone = "771234567",
) {
  changeField(/^Email address/i, email);
  changeField(/^Phone number/i, phone);
}

async function goToReviewStep() {
  await goToContactDetails();

  fillContactDetails();

  fireEvent.click(screen.getByRole("button", { name: "Continue" }));

  await screen.findByRole("heading", {
    name: "Review and create account",
  });
}

async function fillValidRegistration() {
  await goToReviewStep();

  changeField(/^Password$/i, "SecurePass123!");
  changeField(/^Confirm password$/i, "SecurePass123!");
}

describe("Vendor Registration Form", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();

    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/country-codes/") {
        return countries;
      }

      if (url === "/auth/register/vendor/") {
        return { message: "Registration successful" };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the heading and first registration step", async () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("heading", {
        name: "Create your vendor account",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Your details" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith("/country-codes/");
    });
  });

  test("does not show contact or password fields on the first step", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByLabelText(/^First name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Email address/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Password$/i)).not.toBeInTheDocument();
  });

  test("requires personal details before continuing", () => {
    render(<VendorRegistrationForm />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Your details" }),
    ).toBeInTheDocument();
  });

  test("requires usernames to start with @", () => {
    render(<VendorRegistrationForm />);

    changeField(/^First name/i, "Jane");
    changeField(/^Last name/i, "Namara");
    changeField(/^Username/i, "janenamara");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Your details" }),
    ).toBeInTheDocument();
  });

  test("suggests usernames based on the user's name", () => {
    render(<VendorRegistrationForm />);

    changeField(/^First name/i, "Jane");
    changeField(/^Last name/i, "Namara");

    expect(screen.getByText("@janenamara")).toBeInTheDocument();
    expect(screen.getByText("@jane.namara")).toBeInTheDocument();
    expect(screen.getByText("@namarajane")).toBeInTheDocument();
  });

  test("selecting a username suggestion fills the username field", () => {
    render(<VendorRegistrationForm />);

    changeField(/^First name/i, "Jane");
    changeField(/^Last name/i, "Namara");

    fireEvent.click(screen.getByText("@jane.namara"));

    expect(screen.getByLabelText(/^Username/i)).toHaveValue(
      "@jane.namara",
    );
  });

  test("moves forward and backward between registration steps", async () => {
    render(<VendorRegistrationForm />);

    fillPersonalDetails();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByRole("heading", { name: "Contact details" });

    expect(screen.queryByLabelText(/^First name/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(
      await screen.findByRole("heading", { name: "Your details" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/^First name/i)).toHaveValue("Jane");
    expect(screen.getByLabelText(/^Last name/i)).toHaveValue("Namara");
    expect(screen.getByLabelText(/^Username/i)).toHaveValue("@janenamara");
  });

  test("validates an invalid email address", async () => {
    render(<VendorRegistrationForm />);

    await goToContactDetails();
    fillContactDetails("invalid-email", "771234567");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Contact details" }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/^Email address/i),
    ).toHaveAttribute("aria-invalid", "true");
  });

  test("validates an invalid phone number", async () => {
    render(<VendorRegistrationForm />);

    await goToContactDetails();
    fillContactDetails("jane@example.com", "123");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Contact details" }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/^Phone number/i),
    ).toHaveAttribute("aria-invalid", "true");
  });

  test("allows changing the country calling code", async () => {
    render(<VendorRegistrationForm />);

    await goToContactDetails();

    const countrySelect = screen.getByRole("combobox", {
      name: "Country calling code",
    });

    fireEvent.change(countrySelect, { target: { value: "KE" } });

    expect(countrySelect).toHaveValue("KE");
  });

  test("shows password fields on the final step", async () => {
    render(<VendorRegistrationForm />);

    await goToReviewStep();

    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^Confirm password$/i),
    ).toBeInTheDocument();
  });

  test("requires a strong password", async () => {
    render(<VendorRegistrationForm />);

    await goToReviewStep();

    changeField(/^Password$/i, "weak");
    changeField(/^Confirm password$/i, "weak");

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Review and create account",
      }),
    ).toBeInTheDocument();

    expect(apiRequestMock).not.toHaveBeenCalledWith(
      "/auth/register/vendor/",
      expect.anything(),
    );
  });

  test("requires passwords to match", async () => {
    render(<VendorRegistrationForm />);

    await goToReviewStep();

    changeField(/^Password$/i, "SecurePass123!");
    changeField(/^Confirm password$/i, "DifferentPass123!");

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Review and create account",
      }),
    ).toBeInTheDocument();

    expect(apiRequestMock).not.toHaveBeenCalledWith(
      "/auth/register/vendor/",
      expect.anything(),
    );
  });

  test("allows showing and hiding the password", async () => {
    render(<VendorRegistrationForm />);

    await goToReviewStep();

    const passwordInput = screen.getByLabelText(/^Password$/i);

    expect(passwordInput).toHaveAttribute("type", "password");

    const showButton = screen.getByRole("button", {
      name: /show password/i,
    });

    fireEvent.click(showButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(
      screen.getByRole("button", { name: /hide password/i }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("submits valid registration data to the API", async () => {
    render(<VendorRegistrationForm />);

    await fillValidRegistration();

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/auth/register/vendor/",
        {
          method: "POST",
          body: JSON.stringify({
            username: "@janenamara",
            first_name: "Jane",
            last_name: "Namara",
            email: "jane@example.com",
            phone: "+256771234567",
            password: "SecurePass123!",
          }),
        },
      );
    });
  });

  test("shows an API error when registration fails", async () => {
    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/country-codes/") {
        return countries;
      }

      if (url === "/auth/register/vendor/") {
        throw new Error("Email already exists");
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    render(<VendorRegistrationForm />);

    await fillValidRegistration();

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /email already exists/i,
    );
  });

  test("does not submit when the final step has invalid fields", async () => {
    render(<VendorRegistrationForm />);

    await goToReviewStep();

    changeField(/^Password$/i, "weak");
    changeField(/^Confirm password$/i, "notmatching");

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(apiRequestMock).not.toHaveBeenCalledWith(
      "/auth/register/vendor/",
      expect.anything(),
    );
  });

  test("shows a success message after registration", async () => {
    render(<VendorRegistrationForm />);

    await fillValidRegistration();

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Vendor registration successful",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /continue to log in/i }),
    ).toHaveAttribute("href", "/vendor-login");
  });
});

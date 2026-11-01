import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import VendorRegistrationForm from "./VendorRegistrationForm";

const render = (ui: React.ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  apiRequest: apiRequestMock,
}));

// GoogleLogin throws unless it is inside <GoogleOAuthProvider>, and we don't
// want tests loading Google's script anyway, so replace the library.
vi.mock("@react-oauth/google", () => ({
  GoogleLogin: () => <button type="button">Sign in with Google</button>,
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useGoogleLogin: () => vi.fn(),
}));

const countries = [
  { country: "Uganda", iso_code: "UG", dial_code: "+256" },
  { country: "Kenya", iso_code: "KE", dial_code: "+254" },
  { country: "Tanzania", iso_code: "TZ", dial_code: "+255" },
];

// Labels contain a trailing required-star (e.g. "Password *").
const FIRST_NAME = /^First name/i;
const LAST_NAME = /^Last name/i;
const EMAIL = /^Email address/i;
const PHONE = /^Phone number/i;
const PASSWORD = /^Password\s*\*?$/i;
const CONFIRM_PASSWORD = /^Confirm password\s*\*?$/i;

const REGISTER_URL = "/auth/register/vendor/";

function changeField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillForm({
  email = "jane@example.com",
  phone = "771234567",
  password = "SecurePass123!",
  confirm = "SecurePass123!",
} = {}) {
  changeField(FIRST_NAME, "Jane");
  changeField(LAST_NAME, "Namara");
  changeField(EMAIL, email);
  changeField(PHONE, phone);
  changeField(PASSWORD, password);
  changeField(CONFIRM_PASSWORD, confirm);
}

function submit() {
  fireEvent.click(
    screen.getByRole("button", { name: /create vendor account/i }),
  );
}

async function waitForCountries() {
  await waitFor(() => {
    expect(
      screen.getByRole("combobox", { name: "Country calling code" }),
    ).toBeEnabled();
  });
}

function registerCalls() {
  return apiRequestMock.mock.calls.filter(([url]) => url === REGISTER_URL);
}

describe("Vendor Registration Form", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();

    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/country-codes/") {
        return countries;
      }

      if (url === REGISTER_URL) {
        return { message: "Registration successful" };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the heading and every registration field", async () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("heading", { name: "Create your vendor account" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(FIRST_NAME)).toBeInTheDocument();
    expect(screen.getByLabelText(LAST_NAME)).toBeInTheDocument();
    expect(screen.getByLabelText(EMAIL)).toBeInTheDocument();
    expect(screen.getByLabelText(PHONE)).toBeInTheDocument();
    expect(screen.getByLabelText(PASSWORD)).toBeInTheDocument();
    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create vendor account/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith("/country-codes/");
    });
  });

  test("shows the Google sign-in option and a link to vendor login", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("button", { name: /sign in with google/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/vendor/login",
    );
  });

  test("allows the vendor to fill in the form", () => {
    render(<VendorRegistrationForm />);

    fillForm();

    expect(screen.getByLabelText(FIRST_NAME)).toHaveValue("Jane");
    expect(screen.getByLabelText(LAST_NAME)).toHaveValue("Namara");
    expect(screen.getByLabelText(EMAIL)).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(PHONE)).toHaveValue("771234567");
    expect(screen.getByLabelText(PASSWORD)).toHaveValue("SecurePass123!");
    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toHaveValue(
      "SecurePass123!",
    );
  });

  test("does not submit when required fields are empty", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();
    submit();

    expect(registerCalls()).toHaveLength(0);
  });

  test("validates an invalid email address", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();
    fillForm({ email: "invalid-email" });
    submit();

    expect(screen.getByLabelText(EMAIL)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(registerCalls()).toHaveLength(0);
  });

  test("validates an invalid phone number", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();
    fillForm({ phone: "123" });
    submit();

    expect(screen.getByLabelText(PHONE)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(registerCalls()).toHaveLength(0);
  });

  test("allows changing the country calling code", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();

    const countrySelect = screen.getByRole("combobox", {
      name: "Country calling code",
    });

    fireEvent.change(countrySelect, { target: { value: "KE" } });

    expect(countrySelect).toHaveValue("KE");
  });

  test("requires a strong password", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();
    fillForm({ password: "weak", confirm: "weak" });
    submit();

    expect(screen.getByLabelText(PASSWORD)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(registerCalls()).toHaveLength(0);
  });

  test("requires passwords to match", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();
    fillForm({ confirm: "DifferentPass123!" });
    submit();

    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(registerCalls()).toHaveLength(0);
  });

  test("allows showing and hiding the password", () => {
    render(<VendorRegistrationForm />);

    const passwordInput = screen.getByLabelText(PASSWORD);
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("submits valid registration data to the API", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();
    fillForm();
    submit();

    await waitFor(() => {
      expect(registerCalls()).toHaveLength(1);
    });

    const [, options] = registerCalls()[0];
    expect(options.method).toBe("POST");

    expect(JSON.parse(options.body)).toMatchObject({
      first_name: "Jane",
      last_name: "Namara",
      email: "jane@example.com",
      phone: "+256771234567",
      password: "SecurePass123!",
    });
  });

  test("shows an API error when registration fails", async () => {
    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === "/country-codes/") {
        return countries;
      }

      if (url === REGISTER_URL) {
        throw new Error("Email already exists");
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    render(<VendorRegistrationForm />);

    await waitForCountries();
    fillForm();
    submit();

    expect(
      await screen.findByText(/Email already exists/i),
    ).toBeInTheDocument();
  });

  test("shows a success message after registration", async () => {
    render(<VendorRegistrationForm />);

    await waitForCountries();
    fillForm();
    submit();

    expect(
      await screen.findByRole("heading", {
        name: "Vendor registration successful",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /continue to log in/i }),
    ).toHaveAttribute("href", "/vendor/login");

    // The form is replaced by the success message.
    expect(screen.queryByLabelText(FIRST_NAME)).not.toBeInTheDocument();
  });
});

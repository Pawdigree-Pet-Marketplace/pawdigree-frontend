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

import RegistrationPage from "../pages/Customer/RegistrationPage";

const render = (ui: React.ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("../services/api", () => ({
  apiRequest: apiRequestMock,
}));

const countries = [
  { country: "Uganda", iso_code: "UG", dial_code: "+256" },
  { country: "Kenya", iso_code: "KE", dial_code: "+254" },
  { country: "Tanzania", iso_code: "TZ", dial_code: "+255" },
];

// Labels contain a trailing required-star (e.g. "First name *"), so exact
// string matching fails. USERNAME is anchored so it doesn't also match the
// aria-label="Username suggestions" group.
const FIRST_NAME = /^First name/i;
const LAST_NAME = /^Last name/i;
const EMAIL = /^Email address/i;
const USERNAME = /^Username\s*\*?$/i;
const PHONE = /^Phone number/i;
const PASSWORD = /^Password\s*\*?$/i;
const CONFIRM_PASSWORD = /^Confirm password\s*\*?$/i;

function changeField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillStepOne() {
  changeField(FIRST_NAME, "Jane");
  changeField(LAST_NAME, "Doe");
  changeField(EMAIL, "jane@example.com");
  changeField(USERNAME, "janedoe");
  changeField(PHONE, "771234567");
}

async function goToStepTwo() {
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  await screen.findByLabelText(PASSWORD);
}

async function waitForCountries() {
  await waitFor(() => {
    expect(
      screen.getByRole("combobox", { name: "Country calling code" }),
    ).toBeEnabled();
  });
}

beforeEach(() => {
  apiRequestMock.mockReset();
  apiRequestMock.mockImplementation(async (url: string) => {
    if (url === "/country-codes/") return countries;
    if (url.startsWith("/auth/username-available/")) {
      return { available: true };
    }
    throw new Error(`Unexpected API request: ${url}`);
  });
});

afterEach(() => {
  cleanup();
});

describe("Customer Registration Page", () => {
  test("shows the step 1 fields and a Continue button", async () => {
    render(<RegistrationPage />);

    expect(
      screen.getByRole("heading", { name: "Create your account" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(FIRST_NAME)).toBeInTheDocument();
    expect(screen.getByLabelText(LAST_NAME)).toBeInTheDocument();
    expect(screen.getByLabelText(EMAIL)).toBeInTheDocument();
    expect(screen.getByLabelText(USERNAME)).toBeInTheDocument();
    expect(screen.getByLabelText(PHONE)).toBeInTheDocument();

    // Password fields belong to step 2.
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(CONFIRM_PASSWORD)).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();

    await waitForCountries();
  });

  test("allows the customer to fill in both steps", async () => {
    render(<RegistrationPage />);

    await waitForCountries();
    fillStepOne();

    expect(screen.getByLabelText(FIRST_NAME)).toHaveValue("Jane");
    expect(screen.getByLabelText(LAST_NAME)).toHaveValue("Doe");
    expect(screen.getByLabelText(EMAIL)).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(USERNAME)).toHaveValue("janedoe");
    expect(screen.getByLabelText(PHONE)).toHaveValue("771234567");

    await goToStepTwo();

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();

    changeField(PASSWORD, "SecurePass123!");
    changeField(CONFIRM_PASSWORD, "SecurePass123!");

    expect(screen.getByLabelText(PASSWORD)).toHaveValue("SecurePass123!");
    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toHaveValue(
      "SecurePass123!",
    );
  });

  test("allows showing and hiding the password", async () => {
    render(<RegistrationPage />);

    await waitForCountries();
    fillStepOne();
    await goToStepTwo();

    const passwordInput = screen.getByLabelText(PASSWORD);
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("links to the customer login page", () => {
    render(<RegistrationPage />);

    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/customer-login",
    );
  });
});

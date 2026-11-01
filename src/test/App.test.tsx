import { afterEach, describe, expect, test } from "vitest";
import {
  cleanup,
  fireEvent,
  render as rtlRender,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegistrationPage from "../pages/Customer/RegistrationPage";

const render = (ui: React.ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

// Labels contain a trailing required-star (e.g. "First name *"), so exact
// string matching fails. These patterns match with or without the star.
const FIRST_NAME = /^First name/i;
const LAST_NAME = /^Last name/i;
const EMAIL = /^Email address/i;
const PHONE = /^Phone number/i;
const PASSWORD = /^Password\s*\*?$/i;
const CONFIRM_PASSWORD = /^Confirm password\s*\*?$/i;

function changeField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

afterEach(() => {
  cleanup();
});

describe("Customer Registration Page", () => {
  test("shows every registration field on a single page", () => {
    render(<RegistrationPage />);

    expect(screen.getByText("Create your account")).toBeInTheDocument();

    expect(screen.getByLabelText(FIRST_NAME)).toBeInTheDocument();
    expect(screen.getByLabelText(LAST_NAME)).toBeInTheDocument();
    expect(screen.getByLabelText(EMAIL)).toBeInTheDocument();
    expect(screen.getByLabelText(PHONE)).toBeInTheDocument();
    expect(screen.getByLabelText(PASSWORD)).toBeInTheDocument();
    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  test("allows the customer to fill in the registration form", () => {
    render(<RegistrationPage />);

    changeField(FIRST_NAME, "Jane");
    changeField(LAST_NAME, "Doe");
    changeField(EMAIL, "jane@example.com");
    changeField(PHONE, "771234567");
    changeField(PASSWORD, "SecurePass123!");
    changeField(CONFIRM_PASSWORD, "SecurePass123!");

    expect(screen.getByLabelText(FIRST_NAME)).toHaveValue("Jane");
    expect(screen.getByLabelText(LAST_NAME)).toHaveValue("Doe");
    expect(screen.getByLabelText(EMAIL)).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(PHONE)).toHaveValue("771234567");
    expect(screen.getByLabelText(PASSWORD)).toHaveValue("SecurePass123!");
    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toHaveValue(
      "SecurePass123!",
    );
  });

  test("allows showing and hiding the password", () => {
    render(<RegistrationPage />);

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

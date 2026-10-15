import { afterEach, describe, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import VendorRegistrationForm from "./VendorRegistrationForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Fill in the form with valid information for testing.
function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/^Username/i), {
    target: { value: "pawdigreevendor" },
  });

  fireEvent.change(screen.getByLabelText(/^First Name/i), {
    target: { value: "Jane" },
  });

  fireEvent.change(screen.getByLabelText(/^Last Name/i), {
    target: { value: "Namara" },
  });

  fireEvent.change(screen.getByLabelText(/^Email Address/i), {
    target: { value: "jane@example.com" },
  });

  fireEvent.change(screen.getByLabelText(/^Phone Number/i), {
    target: { value: "0771234567" },
  });

  fireEvent.change(screen.getByLabelText(/^Password/i), {
    target: { value: "SecurePass123" },
  });

  fireEvent.change(screen.getByLabelText(/^Confirm Password/i), {
    target: { value: "SecurePass123" },
  });
}

describe("Vendor Registration Form", () => {
  // 1. Check that the heading appears.
  test("renders the vendor registration heading", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("heading", {
        name: "Become a Pawdigree Vendor",
      })
    ).toBeInTheDocument();
  });

  // 2. Check that all account information fields appear.
  test("renders the account information fields", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByLabelText(/^Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Phone Number/i)).toBeInTheDocument();
  });

  // 3. Check that both password fields appear.
  test("renders both password fields", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^Confirm Password/i)
    ).toBeInTheDocument();
  });

  // 4. Business information is registered separately.
  test("does not render business information fields", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.queryByLabelText(/^Business Name/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText(/^Business Type/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText(/^Business Description/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText(/^Business Address/i)
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText(/^District/i)
    ).not.toBeInTheDocument();
  });

  // 5. Check that the terms checkbox appears.
  test("renders the terms acceptance checkbox", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  // 6. Check that the submit button appears.
  test("renders the vendor account submit button", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    ).toBeInTheDocument();
  });

  // 7. Check that Uganda is selected by default.
  test("defaults to Uganda's country calling code", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("combobox", {
        name: "Country calling code",
      })
    ).toHaveValue("+256");
  });

  // 8. Check that the vendor can change the country code.
  test("allows the vendor to select another country calling code", () => {
    render(<VendorRegistrationForm />);

    const countrySelector = screen.getByRole("combobox", {
      name: "Country calling code",
    });

    fireEvent.change(countrySelector, {
      target: { value: "+254" },
    });

    expect(countrySelector).toHaveValue("+254");
  });

  // 9. Check that required-field validation works.
  test("shows required-field errors when the form is submitted empty", () => {
    render(<VendorRegistrationForm />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/email address is required/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/please confirm your password/i)
    ).toBeInTheDocument();
  });

  // 10. Check that an invalid email is rejected.
  test("shows an error for an invalid email address", () => {
    render(<VendorRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^Email Address/i), {
      target: { value: "invalid-email" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
  });

  // 11. Check that short passwords are rejected.
  test("shows an error when the password is too short", () => {
    render(<VendorRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "abc123" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    expect(
      screen.getByText(/at least 8 characters/i)
    ).toBeInTheDocument();
  });

  // 12. Check that both passwords must match.
  test("shows an error when the passwords do not match", () => {
    render(<VendorRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "SecurePass123" },
    });

    fireEvent.change(screen.getByLabelText(/^Confirm Password/i), {
      target: { value: "DifferentPass123" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  // 13. Check that an invalid phone number is rejected.
  test("shows an error for a phone number with too few digits", () => {
    render(<VendorRegistrationForm />);

    fillValidForm();

    fireEvent.change(screen.getByLabelText(/^Phone Number/i), {
      target: { value: "123" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    expect(
      screen.getByText(/enter a valid phone number/i)
    ).toBeInTheDocument();
  });

  // 14. Check that accepting the terms is required.
  test("does not submit when the terms checkbox is unchecked", async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(<VendorRegistrationForm />);

    fillValidForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    expect(screen.getByRole("checkbox")).not.toBeChecked();

    expect(
      await screen.findByText(/accept the terms and conditions/i)
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 15. Check that valid registration details reach the backend.
  test("submits valid registration information with the country code", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Registration successful",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<VendorRegistrationForm />);

    fillValidForm();

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://pawdigree-bckd.onrender.com/api/auth/register/vendor/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    const requestOptions = fetchMock.mock.calls[0][1];
    const submittedData = JSON.parse(requestOptions.body);

    expect(submittedData).toMatchObject({
      username: "pawdigreevendor",
      first_name: "Jane",
      last_name: "Namara",
      email: "jane@example.com",
      phone: "+256771234567",
      password: "SecurePass123",
    });

    expect(submittedData).not.toHaveProperty("confirmPassword");
  });

  // 16. Check that changing the country code changes the submitted phone.
  test("submits the selected country calling code", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Registration successful",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<VendorRegistrationForm />);

    fillValidForm();

    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Country calling code",
      }),
      {
        target: { value: "+254" },
      }
    );

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const requestOptions = fetchMock.mock.calls[0][1];
    const submittedData = JSON.parse(requestOptions.body);

    expect(submittedData.phone).toBe("+254771234567");
  });

  // 17. Check that backend validation errors are displayed.
  test("displays errors returned by the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: "Registration failed",
        email: ["This email is already registered."],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<VendorRegistrationForm />);

    fillValidForm();

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    );

    expect(
      await screen.findByText(/registration failed/i)
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/already registered/i)
    ).toBeInTheDocument();
  });

  // 18. Check that the user can show and hide the password.
  test("allows the user to show and hide the password", () => {
    render(<VendorRegistrationForm />);

    const passwordInput = screen.getByLabelText(/^Password/i);

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show password",
      })
    );

    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide password",
      })
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });
});

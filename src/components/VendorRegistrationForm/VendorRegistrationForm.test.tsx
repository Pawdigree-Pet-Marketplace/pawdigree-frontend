
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import VendorRegistrationForm from "./VendorRegistrationForm";

const countries = [
  { country: "Uganda", iso_code: "UG", dial_code: "+256" },
  { country: "Kenya", iso_code: "KE", dial_code: "+254" },
  { country: "Tanzania", iso_code: "TZ", dial_code: "+255" },
];

const VALID_PASSWORD = "SecurePass123!";

function mockCountryResponse() {
  return {
    ok: true,
    json: async () => countries,
  };
}

function mockFetch(
  registrationResponse: {
    ok: boolean;
    json: () => Promise<Record<string, unknown>>;
  } = {
    ok: true,
    json: async () => ({ message: "Registration successful" }),
  },
) {
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (String(url).includes("/api/country-codes/")) {
      return Promise.resolve(mockCountryResponse());
    }

    if (String(url).includes("/auth/register/vendor/")) {
      return Promise.resolve(registrationResponse);
    }

    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

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
    target: { value: VALID_PASSWORD },
  });
  fireEvent.change(screen.getByLabelText(/^Confirm Password/i), {
    target: { value: VALID_PASSWORD },
  });
}

function getRegistrationCall(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.find(([url]) =>
    String(url).includes("/auth/register/vendor/"),
  );
}

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Vendor Registration Form", () => {
  test("renders the vendor registration heading", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("heading", { name: "Become a Pawdigree Vendor" }),
    ).toBeInTheDocument();
  });

  test("renders the account information fields", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByLabelText(/^Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Phone Number/i)).toBeInTheDocument();
  });

  test("renders both password fields", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm Password/i)).toBeInTheDocument();
  });

  test("does not render business information fields", () => {
    render(<VendorRegistrationForm />);

    expect(screen.queryByLabelText(/^Business Name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Business Type/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/^Business Description/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/^Business Address/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^District/i)).not.toBeInTheDocument();
  });

  test("renders the terms acceptance checkbox", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  test("renders the vendor account submit button", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    ).toBeInTheDocument();
  });

  test("defaults to Uganda's country calling code", async () => {
    render(<VendorRegistrationForm />);

    expect(
      await screen.findByRole("combobox", { name: "Country calling code" }),
    ).toHaveValue("UG");
  });

  test("allows the vendor to select another country calling code", async () => {
    render(<VendorRegistrationForm />);

    const selector = await screen.findByRole("combobox", {
      name: "Country calling code",
    });

    await waitFor(() => expect(selector).toHaveValue("UG"));

    fireEvent.change(selector, { target: { value: "KE" } });

    expect(selector).toHaveValue("KE");
  });

  test("shows required-field errors when the form is submitted empty", () => {
    render(<VendorRegistrationForm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a password/i)).toBeInTheDocument();
    expect(
      screen.getByText(/please confirm your password/i),
    ).toBeInTheDocument();
  });

  test("shows an error for an invalid email address", () => {
    render(<VendorRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^Email Address/i), {
      target: { value: "invalid-email" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
  });

  test("shows an error when the password is too short", () => {
    render(<VendorRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "abc123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test("shows an error when the passwords do not match", () => {
    render(<VendorRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: VALID_PASSWORD },
    });

    fireEvent.change(screen.getByLabelText(/^Confirm Password/i), {
      target: { value: "DifferentPass123!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test("shows an error for a phone number with too few digits", () => {
    render(<VendorRegistrationForm />);

    fillValidForm();

    fireEvent.change(screen.getByLabelText(/^Phone Number/i), {
      target: { value: "123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    expect(screen.getByText(/enter a valid phone number/i)).toBeInTheDocument();
  });

  test("does not submit when the terms checkbox is unchecked", async () => {
    const fetchMock = mockFetch();

    render(<VendorRegistrationForm />);
    fillValidForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    expect(
      await screen.findByText(/accept the terms and conditions/i),
    ).toBeInTheDocument();

    expect(getRegistrationCall(fetchMock)).toBeUndefined();
  });

  test("submits valid registration information with the country code", async () => {
    const fetchMock = mockFetch();

    render(<VendorRegistrationForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    await waitFor(() => {
      expect(getRegistrationCall(fetchMock)).toBeDefined();
    });

    const registrationCall = getRegistrationCall(fetchMock);
    const options = registrationCall?.[1] as RequestInit;
    const submittedData = JSON.parse(String(options.body));

    expect(submittedData).toMatchObject({
      username: "pawdigreevendor",
      first_name: "Jane",
      last_name: "Namara",
      email: "jane@example.com",
      phone: "+256771234567",
      password: VALID_PASSWORD,
    });

    expect(submittedData).not.toHaveProperty("confirmPassword");
  });

  test("submits the selected country's calling code", async () => {
    const fetchMock = mockFetch();

    render(<VendorRegistrationForm />);

    const selector = await screen.findByRole("combobox", {
      name: "Country calling code",
    });

    fireEvent.change(selector, { target: { value: "KE" } });

    fillValidForm();
    fireEvent.change(screen.getByLabelText(/^Phone Number/i), {
      target: { value: "0712345678" },
    });

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    await waitFor(() => {
      expect(getRegistrationCall(fetchMock)).toBeDefined();
    });

    const registrationCall = getRegistrationCall(fetchMock);
    const options = registrationCall?.[1] as RequestInit;
    const submittedData = JSON.parse(String(options.body));

    expect(submittedData.phone).toBe("+254712345678");
  });

  test("displays errors returned by the backend", async () => {
    const fetchMock = mockFetch({
      ok: false,
      json: async () => ({
        detail: "Registration failed",
        email: ["This email is already registered."],
      }),
    });

    render(<VendorRegistrationForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(
      screen.getByRole("button", { name: "Create Vendor Account" }),
    );

    expect(await screen.findByText(/registration failed/i)).toBeInTheDocument();
    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
    expect(getRegistrationCall(fetchMock)).toBeDefined();
  });

  test("allows the user to show and hide the password", () => {
    render(<VendorRegistrationForm />);

    const password = screen.getByLabelText(/^Password/i);

    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(password).toHaveAttribute("type", "password");
  });
});

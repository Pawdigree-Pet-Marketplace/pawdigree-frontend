import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import CustomerRegistrationForm from "./CustomerRegistrationForm";

const render = (ui: React.ReactNode, initialEntry: InitialEntry = "/") =>
  rtlRender(<MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>);

function LoginDestinationProbe() {
  const location = useLocation();
  return <output data-testid="login-destination">{JSON.stringify(location.state)}</output>;
}

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

// Labels contain a trailing required-star (e.g. "Password *").
// USERNAME is anchored so it doesn't also match the
// aria-label="Username suggestions" group.
const FIRST_NAME = /^First name/i;
const LAST_NAME = /^Last name/i;
const EMAIL = /^Email address/i;
const USERNAME = /^Username\s*\*?$/i;
const PHONE = /^Phone number/i;
const PASSWORD = /^Password\s*\*?$/i;
const CONFIRM_PASSWORD = /^Confirm password\s*\*?$/i;

const REGISTER_URL = "/auth/register/customer/";
const USERNAME_CHECK_URL = "/auth/username-available/";

function defaultApi(url: string) {
  if (url === "/country-codes/") {
    return countries;
  }

  if (url === REGISTER_URL) {
    return { message: "Registration successful" };
  }

  if (url.startsWith(USERNAME_CHECK_URL)) {
    return { available: true };
  }

  throw new Error(`Unexpected API request: ${url}`);
}

function changeField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

// ---- Step 1: name, email, username, phone ----
function fillStepOne({
  email = "jane@example.com",
  username = "janenamara",
  phone = "771234567",
} = {}) {
  changeField(FIRST_NAME, "Jane");
  changeField(LAST_NAME, "Namara");
  changeField(EMAIL, email);
  changeField(USERNAME, username);
  changeField(PHONE, phone);
}

function clickContinue() {
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
}

async function goToStepTwo() {
  clickContinue();
  await screen.findByLabelText(PASSWORD);
}

// ---- Step 2: passwords ----
function fillStepTwo({
  password = "SecurePass123!",
  confirm = "SecurePass123!",
} = {}) {
  changeField(PASSWORD, password);
  changeField(CONFIRM_PASSWORD, confirm);
}

// Walks both steps. Leaves the form on step 2, ready to submit.
async function fillForm(
  opts: {
    email?: string;
    username?: string;
    phone?: string;
    password?: string;
    confirm?: string;
  } = {},
) {
  fillStepOne(opts);
  await goToStepTwo();
  fillStepTwo(opts);
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
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

describe("Customer Registration Form", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockImplementation(async (url: string) => defaultApi(url));
  });

  afterEach(() => {
    cleanup();
  });

  // ---------- Step 1 ----------

  test("renders the heading and the step 1 fields", async () => {
    render(<CustomerRegistrationForm />);

    expect(
      screen.getByRole("heading", { name: "Create your account" }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/registration progress: step 1 of 2/i),
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

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith("/country-codes/");
    });
  });

  test("shows a link to customer login", () => {
    render(<CustomerRegistrationForm />);

    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/customer-login",
    );
  });

  test("allows the customer to fill in step 1", () => {
    render(<CustomerRegistrationForm />);

    fillStepOne();

    expect(screen.getByLabelText(FIRST_NAME)).toHaveValue("Jane");
    expect(screen.getByLabelText(LAST_NAME)).toHaveValue("Namara");
    expect(screen.getByLabelText(EMAIL)).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(USERNAME)).toHaveValue("janenamara");
    expect(screen.getByLabelText(PHONE)).toHaveValue("771234567");
  });

  test("does not continue when required fields are empty", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    clickContinue();

    expect(screen.getByLabelText(FIRST_NAME)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
    expect(registerCalls()).toHaveLength(0);
  });

  test("validates an invalid email address", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne({ email: "invalid-email" });
    clickContinue();

    expect(screen.getByLabelText(EMAIL)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
    expect(registerCalls()).toHaveLength(0);
  });

  test("validates an invalid username", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne({ username: "ab" }); // shorter than 3 characters
    clickContinue();

    expect(screen.getByLabelText(USERNAME)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
  });

  test("validates an invalid phone number", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne({ phone: "123" });
    clickContinue();

    expect(screen.getByLabelText(PHONE)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
    expect(registerCalls()).toHaveLength(0);
  });

  test("allows changing the country calling code", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();

    const countrySelect = screen.getByRole("combobox", {
      name: "Country calling code",
    });

    fireEvent.change(countrySelect, { target: { value: "KE" } });

    expect(countrySelect).toHaveValue("KE");
  });

  test("suggests usernames once names and email are entered, and fills one on click", () => {
    render(<CustomerRegistrationForm />);

    expect(
      screen.queryByRole("group", { name: "Username suggestions" }),
    ).not.toBeInTheDocument();

    changeField(FIRST_NAME, "Jane");
    changeField(LAST_NAME, "Namara");
    changeField(EMAIL, "jane@example.com");

    expect(
      screen.getByRole("group", { name: "Username suggestions" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "janenamara" }));

    expect(screen.getByLabelText(USERNAME)).toHaveValue("janenamara");
    // Suggestions disappear once a username is set.
    expect(
      screen.queryByRole("group", { name: "Username suggestions" }),
    ).not.toBeInTheDocument();
  });

  test("blocks Continue when the username is already taken", async () => {
    apiRequestMock.mockImplementation(async (url: string) => {
      if (url.startsWith(USERNAME_CHECK_URL)) {
        return { available: false };
      }
      return defaultApi(url);
    });

    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne();

    // The availability check waits 500ms after typing stops.
    expect(
      await screen.findByText(/already taken/i, {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    clickContinue();

    expect(screen.getByLabelText(USERNAME)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
  });

  // ---------- Step 2 ----------

  test("shows the password fields and submit button on step 2", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne();
    await goToStepTwo();

    expect(
      screen.getByLabelText(/registration progress: step 2 of 2/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(PASSWORD)).toBeInTheDocument();
    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();

    // Step 1 fields are no longer rendered.
    expect(screen.queryByLabelText(FIRST_NAME)).not.toBeInTheDocument();
  });

  test("allows the customer to fill in step 2", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne();
    await goToStepTwo();
    fillStepTwo();

    expect(screen.getByLabelText(PASSWORD)).toHaveValue("SecurePass123!");
    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toHaveValue(
      "SecurePass123!",
    );
  });

  test("Back returns to step 1 and keeps the entered values", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne();
    await goToStepTwo();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(await screen.findByLabelText(FIRST_NAME)).toHaveValue("Jane");
    expect(screen.getByLabelText(EMAIL)).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(USERNAME)).toHaveValue("janenamara");
    expect(screen.getByLabelText(PHONE)).toHaveValue("771234567");
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
  });

  test("requires a strong password", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    await fillForm({ password: "weak", confirm: "weak" });
    submit();

    expect(screen.getByLabelText(PASSWORD)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(registerCalls()).toHaveLength(0);
  });

  test("requires passwords to match", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    await fillForm({ confirm: "DifferentPass123!" });
    submit();

    expect(screen.getByLabelText(CONFIRM_PASSWORD)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(registerCalls()).toHaveLength(0);
  });

  test("allows showing and hiding the password", async () => {
    render(<CustomerRegistrationForm />);

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

  test("allows showing and hiding the confirmation password", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    fillStepOne();
    await goToStepTwo();

    const confirmInput = screen.getByLabelText(CONFIRM_PASSWORD);
    expect(confirmInput).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "Show confirmation password" }),
    );
    expect(confirmInput).toHaveAttribute("type", "text");

    fireEvent.click(
      screen.getByRole("button", { name: "Hide confirmation password" }),
    );
    expect(confirmInput).toHaveAttribute("type", "password");
  });

  // ---------- Submission ----------

  test("submits valid registration data to the API", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    await fillForm();
    submit();

    await waitFor(() => {
      expect(registerCalls()).toHaveLength(1);
    });

    const [, options] = registerCalls()[0];
    expect(options.method).toBe("POST");

    expect(JSON.parse(options.body)).toMatchObject({
      first_name: "Jane",
      last_name: "Namara",
      username: "janenamara",
      email: "jane@example.com",
      phone: "+256771234567",
      password: "SecurePass123!",
    });
  });

  test("shows an API error when registration fails", async () => {
    apiRequestMock.mockImplementation(async (url: string) => {
      if (url === REGISTER_URL) {
        throw new Error("Email already exists");
      }
      return defaultApi(url);
    });

    render(<CustomerRegistrationForm />);

    await waitForCountries();
    await fillForm();
    submit();

    expect(
      await screen.findByText(/Email already exists/i),
    ).toBeInTheDocument();
  });

  test("shows a success message after registration", async () => {
    render(<CustomerRegistrationForm />);

    await waitForCountries();
    await fillForm();
    submit();

    expect(
      await screen.findByRole("heading", { name: "Registration successful" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /continue to log in/i }),
    ).toHaveAttribute("href", "/customer-login");

    // The form is replaced by the success message.
    expect(screen.queryByLabelText(FIRST_NAME)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(PASSWORD)).not.toBeInTheDocument();
  });

  test("preserves checkout destination through registration to login", async () => {
    render(
      <Routes>
        <Route path="/registration" element={<CustomerRegistrationForm />} />
        <Route path="/customer-login" element={<LoginDestinationProbe />} />
      </Routes>,
      { pathname: "/registration", state: { from: { pathname: "/customer/checkout" } } },
    );

    await waitForCountries();
    await fillForm();
    submit();
    fireEvent.click(await screen.findByRole("link", { name: /continue to log in/i }));

    expect(await screen.findByTestId("login-destination")).toHaveTextContent('"pathname":"/customer/checkout"');
  });
});


import { type ReactNode } from "react";
import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import BusinessRegistrationForm from "./BusinessRegistrationForm";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("react-router-dom")>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({
    children,
    title,
    description,
    businessName,
    vendorWorkspace,
  }: {
    children: ReactNode;
    title: string;
    description: string;
    businessName: string;
    vendorWorkspace?: boolean;
  }) => (
    <div
      data-testid="vendor-layout"
      data-title={title}
      data-description={description}
      data-business-name={businessName}
      data-vendor-workspace={String(vendorWorkspace)}
    >
      {children}
    </div>
  ),
}));

const mockCountryCodes = [
  {
    country: "Uganda",
    iso_code: "UG",
    dial_code: "+256",
  },
  {
    country: "Kenya",
    iso_code: "KE",
    dial_code: "+254",
  },
];

function mockFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCountryCodes,
    }),
  );
}

// Mock both the country-code request and registration response.
function mockFetchWithRegistrationResponse(
  responseData: Record<string, unknown>,
  status = 201,
) {
  const fetchMock = vi.fn().mockImplementation((url: RequestInfo | URL) => {
    if (String(url).includes("/api/country-codes/")) {
      return Promise.resolve({
        ok: true,
        json: async () => mockCountryCodes,
      });
    }

    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseData,
    });
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function renderForm() {
  return render(
    <MemoryRouter>
      <BusinessRegistrationForm />
    </MemoryRouter>,
  );
}

async function fillField(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  value: string,
) {
  await user.type(screen.getByLabelText(label), value);
}

async function completeStepOne(
  user: ReturnType<typeof userEvent.setup>,
) {
  await fillField(user, /^business name$/i, "Happy Paws");

  await user.selectOptions(
    screen.getByLabelText(/^business type$/i),
    "PRODUCT_SELLER",
  );

  await fillField(
    user,
    /^business description$/i,
    "Pet products and care",
  );
}

async function goToStepTwo(
  user: ReturnType<typeof userEvent.setup>,
) {
  await completeStepOne(user);

  await user.click(
    screen.getByRole("button", { name: /continue/i }),
  );

  expect(
    await screen.findByLabelText(/^business address$/i),
  ).toBeInTheDocument();
}

async function completeStepTwo(
  user: ReturnType<typeof userEvent.setup>,
) {
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
    /^business email$/i,
    "happy@paws.com",
  );

  await fillField(
    user,
    /^business phone$/i,
    "+256712345678",
  );
}

async function goToStepThree(
  user: ReturnType<typeof userEvent.setup>,
) {
  await goToStepTwo(user);
  await completeStepTwo(user);

  await user.click(
    screen.getByRole("button", { name: /continue/i }),
  );

  expect(
    await screen.findByRole("group", {
      name: /business operating hours/i,
    }),
  ).toBeInTheDocument();
}

async function prepareValidSubmission(
  user: ReturnType<typeof userEvent.setup>,
) {
  await goToStepThree(user);

  await user.click(
    screen.getByRole("checkbox", {
      name: /i agree to the terms and conditions/i,
    }),
  );
}

describe("Business Registration Form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Initial rendering

  it("renders the VendorLayout wrapper", () => {
    renderForm();

    expect(
      screen.getByTestId("vendor-layout"),
    ).toBeInTheDocument();
  });

  it("does not display a repeated registration heading inside the form", () => {
    renderForm();

    expect(
      screen.queryByRole("heading", {
        name: /^register your business$/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not display a business category field", () => {
    renderForm();

    expect(
      screen.queryByLabelText(/business category/i),
    ).not.toBeInTheDocument();
  });

  it("does not display an additional navigation button", () => {
    renderForm();

    expect(
      screen.queryByRole("button", {
        name: /dashboard|vendor dashboard/i,
      }),
    ).not.toBeInTheDocument();
  });

  // Vendor layout

  it("passes the correct title to VendorLayout", () => {
    renderForm();

    expect(
      screen.getByTestId("vendor-layout"),
    ).toHaveAttribute("data-title", "Register your business");
  });

  it("passes the correct description to VendorLayout", () => {
    renderForm();

    expect(
      screen.getByTestId("vendor-layout"),
    ).toHaveAttribute(
      "data-description",
      "Step 1 of 3 — Business information",
    );
  });

  it("enables the vendor workspace layout", () => {
    renderForm();

    expect(
      screen.getByTestId("vendor-layout"),
    ).toHaveAttribute("data-vendor-workspace", "true");
  });

  it("uses Your store as the default business name in VendorLayout", () => {
    renderForm();

    expect(
      screen.getByTestId("vendor-layout"),
    ).toHaveAttribute("data-business-name", "Your store");
  });

  it("updates the VendorLayout business name when the user types", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillField(
      user,
      /^business name$/i,
      "Happy Paws",
    );

    expect(
      screen.getByTestId("vendor-layout"),
    ).toHaveAttribute("data-business-name", "Happy Paws");
  });

  // Country codes

  it("loads the available phone country codes", async () => {
    renderForm();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/country-codes/"),
        expect.any(Object),
      );
    });
  });

  it("handles failure when phone country codes cannot be loaded", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    renderForm();

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  // Step one: Business information

  it("allows a vendor to select Pet Sale / Adoption as their business type", async () => {
    const user = userEvent.setup();
    renderForm();

    const businessTypeSelect = screen.getByLabelText(
      /^business type$/i,
    );

    await user.selectOptions(
      businessTypeSelect,
      "PET_SALE_ADOPTION",
    );

    expect(businessTypeSelect).toHaveValue("PET_SALE_ADOPTION");
  });

  it("requires a business name", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(
      screen.getByLabelText(/^business type$/i),
      "PRODUCT_SELLER",
    );

    await fillField(
      user,
      /^business description$/i,
      "Pet products and care",
    );

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    expect(
      await screen.findByText(/business name is required/i),
    ).toBeInTheDocument();
  });

  it("requires a business description", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillField(
      user,
      /^business name$/i,
      "Happy Paws",
    );

    await user.selectOptions(
      screen.getByLabelText(/^business type$/i),
      "PRODUCT_SELLER",
    );

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    expect(
      await screen.findByText(
        /business description is required/i,
      ),
    ).toBeInTheDocument();
  });

  it("retains the 500-character business description limit", async () => {
    const user = userEvent.setup();
    renderForm();
    await fillField(user, /^business name$/i, "Happy Paws");
    await user.selectOptions(screen.getByLabelText(/^business type$/i), "PRODUCT_SELLER");
    const description = screen.getByLabelText(/^business description$/i);
    expect(description).toHaveAttribute("maxLength", "500");
    fireEvent.change(description, { target: { value: "x".repeat(501) } });
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/description cannot exceed 500 characters/i)).toBeInTheDocument();
  });

  it("does not advance when required first-step fields are missing", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    expect(
      screen.getByText(/business name is required/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/please select your business type/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/business description is required/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/step 1 of 3/i),
    ).toBeInTheDocument();
  });

  it("advances to step two when valid business information is provided", async () => {
    const user = userEvent.setup();
    renderForm();

    await completeStepOne(user);

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    expect(
      await screen.findByLabelText(/^business address$/i),
    ).toBeInTheDocument();
  });

  // Step two: Business contact information

  it("validates an invalid business email on step two", async () => {
    const user = userEvent.setup();
    renderForm();

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
      /^business email$/i,
      "invalid-email",
    );

    await fillField(
      user,
      /^business phone$/i,
      "+256712345678",
    );

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    expect(
      await screen.findByText(/valid email/i),
    ).toBeInTheDocument();
  });

  it("requires a city or district on step two", async () => {
    const user = userEvent.setup();
    renderForm();

    await goToStepTwo(user);

    await fillField(
      user,
      /^business address$/i,
      "Kampala Road",
    );

    await fillField(
      user,
      /^business email$/i,
      "happy@paws.com",
    );

    await fillField(
      user,
      /^business phone$/i,
      "+256712345678",
    );

    await user.click(
      screen.getByRole("button", { name: /continue/i }),
    );

    expect(
      await screen.findByText(/city or district is required/i),
    ).toBeInTheDocument();
  });

  // Step three: Operating hours and terms

  it("requires agreement to the terms on step three", async () => {
    const user = userEvent.setup();
    renderForm();

    await goToStepThree(user);

    const termsCheckbox = screen.getByRole("checkbox", {
      name: /i agree to the terms and conditions/i,
    });

    expect(termsCheckbox).not.toBeChecked();

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByText(/agree to the terms/i),
    ).toBeInTheDocument();
  });

  it("requires vendor login before submitting a business", async () => {
    const user = userEvent.setup();
    renderForm();

    await prepareValidSubmission(user);

    await user.click(
      screen.getByRole("button", {
        name: /register/i,
      }),
    );

    expect(
      await screen.findByText(/please log in/i),
    ).toBeInTheDocument();

    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/auth/businesses/register/",
      ),
      expect.any(Object),
    );
  });

  // Business registration API submission

  it("sends the correct registration data and authentication token to the backend", async () => {
    const user = userEvent.setup();

    localStorage.setItem("access", "test-access-token");

    const fetchMock = mockFetchWithRegistrationResponse({
      id: "business-123",
      name: "Happy Paws",
      business_type: "PRODUCT_SELLER",
    });

    renderForm();

    await prepareValidSubmission(user);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/auth/businesses/register/",
        ),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer test-access-token",
          }),
        }),
      );
    });

    const registrationCall = fetchMock.mock.calls.find(
      ([url]) =>
        String(url).includes("/api/auth/businesses/register/"),
    );

    expect(registrationCall).toBeDefined();

    const requestOptions = registrationCall?.[1];
    const submittedData = JSON.parse(
      requestOptions?.body as string,
    );

    expect(submittedData).toEqual({
      name: "Happy Paws",
      business_type: "PRODUCT_SELLER",
      description: "Pet products and care",
      contact: "+256712345678",
      email: "happy@paws.com",
      address: "Kampala Road",
      city_district: "Kampala",
      business_hours: expect.objectContaining({
        monday: {
          is_open: true,
          open: "09:00",
          close: "17:00",
        },
        sunday: {
          is_open: false,
          open: "09:00",
          close: "17:00",
        },
      }),
    });
  });

  it("saves the returned business ID and business type in session storage", async () => {
    const user = userEvent.setup();

    localStorage.setItem("access", "test-access-token");

    mockFetchWithRegistrationResponse({
      id: "business-123",
      name: "Happy Paws",
      business_type: "PRODUCT_SELLER",
    });

    renderForm();

    await prepareValidSubmission(user);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    await waitFor(() => {
      expect(
        sessionStorage.getItem("onboardingBusinessId"),
      ).toBe("business-123");
    });

    expect(
      sessionStorage.getItem("onboardingBusinessType"),
    ).toBe("PRODUCT_SELLER");
  });

  it("redirects to the document upload page after successful registration", async () => {
    const user = userEvent.setup();

    localStorage.setItem("access", "test-access-token");

    mockFetchWithRegistrationResponse({
      id: "business-123",
      name: "Happy Paws",
      business_type: "PRODUCT_SELLER",
    });

    renderForm();

    await prepareValidSubmission(user);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/vendor/documents/business-123",
      );
    });
  });

  it("displays backend validation errors when registration fails", async () => {
    const user = userEvent.setup();

    localStorage.setItem("access", "test-access-token");

    mockFetchWithRegistrationResponse(
      {
        email: ["A business with this email already exists."],
      },
      400,
    );

    renderForm();

    await prepareValidSubmission(user);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "email: A business with this email already exists.",
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("displays an expired-session message when the backend returns 401", async () => {
    const user = userEvent.setup();

    localStorage.setItem("access", "expired-access-token");

    mockFetchWithRegistrationResponse(
      {
        detail: "Authentication credentials were not provided.",
      },
      401,
    );

    renderForm();

    await prepareValidSubmission(user);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      /login session is invalid or expired/i,
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("displays an error if the successful response does not contain a business ID", async () => {
    const user = userEvent.setup();

    localStorage.setItem("access", "test-access-token");

    mockFetchWithRegistrationResponse({
      name: "Happy Paws",
      business_type: "PRODUCT_SELLER",
    });

    renderForm();

    await prepareValidSubmission(user);

    await user.click(
      screen.getByRole("button", {
        name: /register business/i,
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      /business was registered, but its ID was not returned/i,
    );

    expect(mockNavigate).not.toHaveBeenCalled();

    expect(
      sessionStorage.getItem("onboardingBusinessId"),
    ).toBeNull();
  });
});

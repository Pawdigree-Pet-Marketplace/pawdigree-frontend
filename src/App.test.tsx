
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import App from "./App";
import { saveAuthSession, type UserRole } from "./services/auth/authStorage";

const { customerFetchMock, vendorFetchMock } = vi.hoisted(() => ({
  customerFetchMock: vi.fn(),
  vendorFetchMock: vi.fn(),
}));

vi.mock("./services/customerAuthenticatedFetch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./services/customerAuthenticatedFetch")>();
  return { ...actual, customerAuthenticatedFetch: customerFetchMock };
});

vi.mock("./services/vendorAuthenticatedFetch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./services/vendorAuthenticatedFetch")>();
  return { ...actual, vendorAuthenticatedFetch: vendorFetchMock };
});

vi.mock("./components/navigation/CustomerDashboardNav/CustomerDashboardNav", () => ({
  default: () => <nav aria-label="Customer dashboard">Customer dashboard navigation</nav>,
}));

vi.mock("./pages/Customer/CustomerLandingPage", () => ({
  default: () => <main><h1>Public landing route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorLandingPage", () => ({
  default: () => <main><h1>Public vendor landing route</h1></main>,
}));

vi.mock("./pages/Customer/CustomerPetCataloguePage", () => ({
  default: () => (
    <main>
      <h1>Pet catalogue route</h1>
      <Link to="/pets/42">Open pet 42</Link>
    </main>
  ),
}));

vi.mock("./pages/Customer/PetsDetailPage", async () => {
  const { useParams: readParams } = await import("react-router-dom");

  return {
    default: () => <main><h1>Pet detail route {readParams().petId}</h1></main>,
  };
});

vi.mock("./pages/Customer/CustomerVendorsPage", () => ({
  default: () => (
    <main>
      <h1>Vendor listing route</h1>
      <Link to="/vendors/clinic-7">Open clinic 7</Link>
    </main>
  ),
}));

vi.mock("./pages/Customer/CustomerVendorProfilePage", async () => {
  const { useParams: readParams } = await import("react-router-dom");

  return {
    default: () => <main><h1>Vendor profile route {readParams().id}</h1></main>,
  };
});

vi.mock("./pages/Customer/AdoptionRequest", () => ({
  default: () => <main><h1>Adoption request route</h1></main>,
}));

vi.mock("./pages/Customer/CustomerProfilePage", () => ({
  default: () => <main><h1>Customer profile route</h1></main>,
}));

vi.mock("./pages/Customer/CustomerCartPage", () => ({
  default: () => <main><h1>Customer cart route</h1></main>,
}));

vi.mock("./pages/Customer/CustomerOrderHistoryPage", () => ({
  default: () => <main><h1>Customer orders route</h1></main>,
}));

vi.mock("./pages/Customer/CustomerDashboard", () => ({
  default: () => <main><h1>Customer dashboard route</h1></main>,
}));

vi.mock("./pages/Customer/CustomerAdoptionPage", () => ({
  default: () => <main><h1>Customer adoption route</h1></main>,
}));

vi.mock("./pages/Customer/CustomerLoginPage", () => ({
  default: () => <main><h1>Customer login route</h1></main>,
}));

vi.mock("./pages/Customer/RegistrationPage", () => ({
  default: () => <main><h1>Customer registration route</h1></main>,
}));

vi.mock("./pages/VerifyEmailPage", () => ({
  default: () => <main><h1>Email verification route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorLoginPage", () => ({
  default: () => <main><h1>Vendor login route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorRegistrationPage", () => ({
  default: () => <main><h1>Vendor registration route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorDashboardPage", () => ({
  default: () => <main><h1>Vendor dashboard route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorBusinessDashboardPage", () => ({
  default: () => <main><h1>Vendor dashboard route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorBusinessProfilePage", () => ({
  default: () => <main><h1>Vendor business profile route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorProfilePage", () => ({
  default: () => <main><h1>Vendor personal profile route</h1></main>,
}));

vi.mock("./pages/Vendor/VendorCategorySelector", () => ({
  default: () => <main><h1>Vendor categories route</h1></main>,
}));

function LocationProbe() {
  const location = useLocation();

  return (
    <output data-testid="current-location">
      {location.pathname}{location.search}
    </output>
  );
}

function HistoryControls() {
  const navigate = useNavigate();

  return (
    <div>
      <button type="button" onClick={() => navigate(-1)}>Go back</button>
      <button type="button" onClick={() => navigate(1)}>Go forward</button>
    </div>
  );
}

function renderApp(path: string, role?: UserRole) {
  if (role) {
    saveAuthSession({
      access: `${role.toLowerCase()}-access`,
      refresh: "refresh-token",
      role,
    });
  }

  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
      <HistoryControls />
    </MemoryRouter>,
  );
}

function currentPath() {
  return screen.getByTestId("current-location").textContent;
}

function mockBusinessResponse(
  businessId: string,
  response: {
    ok: boolean;
    status: number;
    json?: () => Promise<unknown>;
  },
) {
  vendorFetchMock.mockImplementation(async (url: string) => {
    if (url.includes(`/api/businesses/${businessId}/`)) {
      return response;
    }

    return {
      ok: true,
      status: 200,
      json: async () => [],
    };
  });
}

describe("App route configuration", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    customerFetchMock.mockReset().mockResolvedValue({
      ok: true,
      json: async () => ({ first_name: "Casey" }),
    });

    vendorFetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: "business-1", name: "Paws & Co" }],
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders the public landing page inside the public layout", () => {
    renderApp("/");

    expect(
      screen.getByRole("heading", { name: "Public landing route" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("serves the public vendor landing page instead of the protected vendor catch-all", () => {
    renderApp("/vendor");

    expect(
      screen.getByRole("heading", { name: "Public vendor landing route" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: "Vendor login route" }),
    ).not.toBeInTheDocument();
  });

  it("renders the public pet catalogue and pet detail route, including browser history navigation", () => {
    renderApp("/pets");

    expect(
      screen.getByRole("heading", { name: "Pet catalogue route" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Open pet 42" }));

    expect(
      screen.getByRole("heading", { name: "Pet detail route 42" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(
      screen.getByRole("heading", { name: "Pet catalogue route" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go forward" }));

    expect(
      screen.getByRole("heading", { name: "Pet detail route 42" }),
    ).toBeInTheDocument();
  });

  it("renders vendor listings and a specific vendor profile as separate public routes", () => {
    renderApp("/vendors");

    expect(
      screen.getByRole("heading", { name: "Vendor listing route" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Open clinic 7" }));

    expect(
      screen.getByRole("heading", { name: "Vendor profile route clinic-7" }),
    ).toBeInTheDocument();
  });

  it("requires a customer session for adoption requests and renders the customer shell", () => {
    renderApp("/adoption-request");

    expect(currentPath()).toBe("/login");

    expect(
      screen.getByRole("heading", { name: "Customer login route" }),
    ).toBeInTheDocument();
  });

  it("allows customers to open adoption requests while denying vendors", () => {
    const { unmount } = renderApp("/adoption-request", "CUSTOMER");

    expect(
      screen.getByRole("heading", { name: "Adoption request route" }),
    ).toBeInTheDocument();

    expect(
      document.querySelector(".customer-shell-content"),
    ).toBeInTheDocument();

    unmount();

    renderApp("/adoption-request", "VENDOR");

    expect(
      screen.getByRole("heading", { name: /you can’t access this page/i }),
    ).toBeInTheDocument();
  });

  it("allows unauthenticated visitors to access the customer cart", () => {
    renderApp("/customer/cart");

    expect(currentPath()).toBe("/customer/cart");

    expect(
      screen.getByRole("heading", { name: "Customer cart route" }),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated vendors to vendor login", () => {
    renderApp("/vendor/dashboard");

    expect(currentPath()).toBe("/vendor/login");

    expect(
      screen.getByRole("heading", { name: "Vendor login route" }),
    ).toBeInTheDocument();
  });

  it("allows each role into its own dashboard and denies the other role", async () => {
    const customer = renderApp("/customer/dashboard", "CUSTOMER");

    expect(
      screen.getByRole("heading", { name: "Customer dashboard route" }),
    ).toBeInTheDocument();

    customer.unmount();

    const vendor = renderApp("/vendor/dashboard", "VENDOR");

    expect(
      await screen.findByRole("heading", { name: "Vendor dashboard route" }),
    ).toBeInTheDocument();

    vendor.unmount();

    renderApp("/vendor/dashboard", "CUSTOMER");

    expect(
      screen.getByRole("heading", { name: /you can’t access this page/i }),
    ).toBeInTheDocument();
  });

  it("redirects a vendor without a business from a direct dashboard URL", async () => {
    vendorFetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    renderApp("/vendor/dashboard", "VENDOR");

    expect(screen.getByText(/checking your business registration/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/business name/i)).toBeInTheDocument();
    expect(currentPath()).toBe("/vendor/business-registration");
  });

  it("keeps the dashboard blocked and reports an ownership check failure", async () => {
    vendorFetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    renderApp("/vendor/dashboard", "VENDOR");

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't verify your business registration/i);
    expect(currentPath()).toBe("/vendor/dashboard");
    expect(screen.queryByRole("heading", { name: "Vendor dashboard route" })).not.toBeInTheDocument();
  });

  it("keeps registration and verification pages in the auth layout", () => {
    renderApp("/registration");

    expect(
      screen.getByRole("heading", { name: "Customer registration route" }),
    ).toBeInTheDocument();

    expect(
      document.querySelector(".auth-layout-logo"),
    ).toBeInTheDocument();

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("renders vendor category pages in VendorLayout and protects their access", () => {
    renderApp("/vendor/categories", "VENDOR");

    expect(
      screen.getByRole("heading", { name: "Vendor categories route" }),
    ).toBeInTheDocument();

    expect(
      document.querySelector(".vendor-dashboard"),
    ).toBeInTheDocument();
  });

  it("checks business-specific routes after vendor authorization", async () => {
    mockBusinessResponse("business-7", {
      ok: true,
      status: 200,
      json: async () => ({
        id: "business-7",
        name: "Paws & Co",
      }),
    });

    renderApp("/vendor/business/business-7/dashboard", "VENDOR");

    expect(
      await screen.findByRole("heading", { name: "Vendor dashboard route" }),
    ).toBeInTheDocument();

    expect(vendorFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/businesses/business-7/"),
    );
  });

  it("loads the vendor personal profile under a business-scoped route", async () => {
    mockBusinessResponse("business-7", {
      ok: true,
      status: 200,
      json: async () => ({
        id: "business-7",
        name: "Paws & Co",
        business_type: "SERVICE_PROVIDER",
      }),
    });

    renderApp("/vendor/business/business-7/profile", "VENDOR");

    expect(
      await screen.findByRole("heading", {
        name: "Vendor personal profile route",
      }),
    ).toBeInTheDocument();

    expect(vendorFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/businesses/business-7/"),
    );
  });

  it("redirects a vendor with an invalid business URL to business profile", async () => {
    mockBusinessResponse("missing", {
      ok: false,
      status: 404,
    });

    renderApp("/vendor/business/missing/dashboard", "VENDOR");

    expect(
      await screen.findByRole("heading", {
        name: "Vendor business profile route",
      }),
    ).toBeInTheDocument();

    expect(currentPath()).toBe("/vendor/business-profile");
  });
});

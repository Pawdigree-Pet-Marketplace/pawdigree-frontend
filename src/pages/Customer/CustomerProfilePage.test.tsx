
import { render as rtlRender, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import API_BASE_URL from "../../services/api";
import ProfilePage from "./CustomerProfilePage";

const render = (ui: React.ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe("ProfilePage", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading message while fetching the profile", () => {
    localStorage.setItem("token", "test-access-token");

    mockFetch.mockReturnValue(new Promise(() => {}));

    render(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your profile...",
    );
  });

  it("displays the authenticated customer's profile from the API", async () => {
    localStorage.setItem("token", "test-access-token");

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        username: "ari",
        first_name: "Faith",
        last_name: "Ahaisibwe",
        email: "faith@example.com",
        phone: "+256772123456",
      }),
    });

    render(<ProfilePage />);

    expect(await screen.findByText("Faith Ahaisibwe")).toBeInTheDocument();
    expect(screen.getByText("faith@example.com")).toBeInTheDocument();
    expect(screen.getByText("+256772123456")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/profile/edit",
    );
    expect(screen.getByText("My orders")).toBeInTheDocument();
    expect(screen.getByText("Security & password")).toBeInTheDocument();

    const [requestUrl, requestInit] = mockFetch.mock.calls[0];
    expect(String(requestUrl)).toBe(`${API_BASE_URL}/api/auth/profile/`);
    expect(new Headers(requestInit?.headers).get("Authorization")).toBe(
      "Bearer test-access-token",
    );
  });

  it("asks the customer to log in when no token exists", async () => {
    render(<ProfilePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please log in to view your profile.",
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/customer-login",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows a session-expired message when the API returns 401", async () => {
    localStorage.setItem("token", "expired-access-token");

    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Your session may have expired. Please log in again.",
      );
    });

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/customer-login",
    );
  });
});

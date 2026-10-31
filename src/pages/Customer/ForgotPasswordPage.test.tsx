import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { apiRequest } from "../../services/api";
import ForgotPasswordPage from "./ForgotPasswordPage";

vi.mock("../../services/api", () => ({
  apiRequest: vi.fn(),
}));

const render = (ui: React.ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the forgot password form", () => {
    render(<ForgotPasswordPage />);

    expect(
      screen.getByRole("heading", {
        name: "Forgot your password?",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Send reset link",
      }),
    ).toBeInTheDocument();
  });

  it("shows an error when the email format is invalid", () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Send reset link",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter a valid email address.",
    );

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("submits a valid email and displays the success message", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      detail: "Password reset instructions will be sent.",
    });

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Send reset link",
      }),
    );

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith("/auth/password-reset/request/", {
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
        }),
      });
    });

    expect(
      await screen.findByRole("heading", {
        name: "Check your email",
      }),
    ).toBeInTheDocument();
  });

  it("shows an error when the API request fails", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error("Network error"));

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Send reset link",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't process your request right now. Please try again later.",
    );
  });
});

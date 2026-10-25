
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import BusinessVerificationStatus from "./BusinessVerificationStatus";

vi.mock("../../services/api", () => ({
  default: "http://localhost:8000/api",
}));

describe("BusinessVerificationStatus", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("access", "test-token");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a loading message while fetching the status", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));

    render(<BusinessVerificationStatus />);

    expect(
      screen.getByText("Checking your application status..."),
    ).toBeInTheDocument();
  });

  it("displays the pending status", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "pending" }),
    } as Response);

    render(<BusinessVerificationStatus />);

    expect(await screen.findByText("Pending review")).toBeInTheDocument();
  });

  it("displays the approved status", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "approved" }),
    } as Response);

    render(<BusinessVerificationStatus />);

    expect(await screen.findByText("Approved")).toBeInTheDocument();
  });

  it("displays the rejection reason when supplied", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "rejected",
        rejection_reason: "Please upload a clearer business licence.",
      }),
    } as Response);

    render(<BusinessVerificationStatus />);

    expect(await screen.findByText("Rejected")).toBeInTheDocument();
    expect(
      await screen.findByText("Please upload a clearer business licence."),
    ).toBeInTheDocument();
  });

  it("shows an error message when the API request fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    render(<BusinessVerificationStatus />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "We couldn't load your verification status. Please try again later.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows an error when no authentication token exists", async () => {
    localStorage.clear();

    render(<BusinessVerificationStatus />);

    expect(
      await screen.findByText(
        "We couldn't load your verification status. Please try again later.",
      ),
    ).toBeInTheDocument();

    expect(fetch).not.toHaveBeenCalled();
  });
});


import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import BusinessVerificationStatus from "./BusinessVerificationStatus";

const mockBusinesses = [
  {
    id: "business-1",
    name: "Happy Paws",
    verification_status: "pending",
    decision_reason: null,
    reviewed_at: null,
    is_active: false,
    can_sell: false,
  },
];

describe("BusinessVerificationStatus", () => {
  beforeEach(() => {
    localStorage.setItem("access", "test-access-token");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBusinesses,
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("shows a loading message while fetching the status", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    render(<BusinessVerificationStatus />);

    expect(
      screen.getByText("Checking your application status..."),
    ).toBeInTheDocument();
  });

  it("displays the pending status", async () => {
    render(<BusinessVerificationStatus />);

    expect(await screen.findByText("Happy Paws")).toBeInTheDocument();
    expect(await screen.findByText("Pending review")).toBeInTheDocument();
  });

  it("displays the approved status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            ...mockBusinesses[0],
            verification_status: "approved",
            is_active: true,
            can_sell: true,
          },
        ],
      }),
    );

    render(<BusinessVerificationStatus />);

    expect(await screen.findByText("Approved")).toBeInTheDocument();
  });

  it("omits the no-selling-category message and styles the merchandise card by business type", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        ...mockBusinesses[0],
        verification_status: "approved",
        is_active: true,
        can_sell: false,
        categories: [],
      }],
    }));

    render(<BusinessVerificationStatus businessId="business-1" businessType="PRODUCT_SELLER" />);

    expect(await screen.findByText("Happy Paws")).toBeInTheDocument();
    expect(screen.getByText("Merchandise")).toBeInTheDocument();
    expect(screen.getByLabelText("Happy Paws verification status")).toHaveClass("verification-card--merchandise");
    expect(screen.queryByText(/no selling category is currently approved/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/your business/i)).not.toBeInTheDocument();
  });

  it.each([
    ["PET_SALE_ADOPTION", "verification-card--pets", "Pet sales & adoption"],
    ["SERVICE_PROVIDER", "verification-card--services", "Services"],
  ])("uses the %s visual treatment", async (businessType, cardClass, label) => {
    render(<BusinessVerificationStatus businessId="business-1" businessType={businessType} />);

    const card = await screen.findByLabelText("Happy Paws verification status");
    expect(card).toHaveClass(cardClass);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("displays the rejection reason when supplied", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            ...mockBusinesses[0],
            verification_status: "rejected",
            decision_reason: "Please upload a clearer business licence.",
            reviewed_at: "2026-10-22T10:00:00Z",
            is_active: false,
            can_sell: false,
          },
        ],
      }),
    );

    render(<BusinessVerificationStatus />);

    expect(await screen.findByText("Rejected")).toBeInTheDocument();
    expect(
      await screen.findByText("Please upload a clearer business licence."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reviewed on:/)).toBeInTheDocument();
  });

  it("shows an error message when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    render(<BusinessVerificationStatus />);

    expect(
      await screen.findByText(
        /We couldn't load your verification status/,
      ),
    ).toBeInTheDocument();
  });

  it("shows an error when no authentication token exists", async () => {
    localStorage.clear();

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<BusinessVerificationStatus />);

    expect(
      await screen.findByText(
        /We couldn't load your verification status/,
      ),
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});


import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyBookingsPage from "./MyBookingsPage";
import { fetchCustomerBookings } from "../../services/bookings/bookingApi";

vi.mock("../../services/bookings/bookingApi", () => ({
  fetchCustomerBookings: vi.fn(),
}));

const mockBooking = {
  booking_id: 123,
  service: 12,
  service_name: "Pet Grooming",
  start_at: "2026-11-26T10:00:00Z",
  end_at: "2026-11-26T11:00:00Z",
  status: "pending" as const,
  status_display: "Pending",
  notes: "Please handle my pet gently.",
  decision_reason: "",
  created_at: "2026-11-24T08:00:00Z",
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyBookingsPage />
    </MemoryRouter>,
  );

describe("MyBookingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading message while bookings are being fetched", () => {
    vi.mocked(fetchCustomerBookings).mockReturnValue(
      new Promise(() => {}),
    );

    renderPage();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays booking details and its current status", async () => {
    vi.mocked(fetchCustomerBookings).mockResolvedValue([mockBooking]);

    renderPage();

    expect(await screen.findByText("Pet Grooming")).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(
      screen.getByText("Please handle my pet gently."),
    ).toBeInTheDocument();
  });

  it("displays the empty state when the customer has no bookings", async () => {
    vi.mocked(fetchCustomerBookings).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("No bookings yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse pet services" }),
    ).toBeInTheDocument();
  });

  it("displays the reason when a booking is declined", async () => {
    vi.mocked(fetchCustomerBookings).mockResolvedValue([
      {
        ...mockBooking,
        status: "declined",
        status_display: "Declined",
        decision_reason: "The selected appointment time is unavailable.",
      },
    ]);

    renderPage();

    expect(await screen.findByText("Pet Grooming")).toBeInTheDocument();
    expect(
      screen.getByText("The selected appointment time is unavailable."),
    ).toBeInTheDocument();
  });

  it("shows an error and allows the customer to retry", async () => {
    vi.mocked(fetchCustomerBookings)
      .mockRejectedValueOnce(new Error("Unable to load bookings."))
      .mockResolvedValueOnce([mockBooking]);

    renderPage();

    expect(
      await screen.findByText("Unable to load bookings."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Pet Grooming")).toBeInTheDocument();
    expect(fetchCustomerBookings).toHaveBeenCalledTimes(2);
  });
});

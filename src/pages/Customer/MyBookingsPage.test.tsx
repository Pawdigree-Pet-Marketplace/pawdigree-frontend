
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyBookingsPage from "./MyBookingsPage";
import {
  fetchCustomerBookings,
  fetchServiceAvailableTimes,
  cancelCustomerBooking,
  rescheduleCustomerBooking,
  type BookingResponse,
} from "../../services/bookings/bookingApi";

vi.mock("../../services/bookings/bookingApi", () => ({
  fetchCustomerBookings: vi.fn(),
  fetchServiceAvailableTimes: vi.fn(),
  cancelCustomerBooking: vi.fn(),
  rescheduleCustomerBooking: vi.fn(),
}));

const mockBooking: BookingResponse = {
  booking_id: 123,
  service: 12,
  service_name: "Pet Grooming",
  start_at: "2026-11-28T10:00:00Z",
  end_at: "2026-11-28T11:00:00Z",
  status: "pending",
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

    vi.mocked(fetchCustomerBookings).mockResolvedValue([mockBooking]);

    vi.mocked(fetchServiceAvailableTimes).mockResolvedValue({
      service_id: 12,
      date: "2026-11-28",
      duration: 60,
      times: ["2026-11-28T07:00:00Z"],
    });

    vi.mocked(cancelCustomerBooking).mockResolvedValue({
      ...mockBooking,
      status: "cancelled",
      status_display: "Cancelled",
    });

    vi.mocked(rescheduleCustomerBooking).mockResolvedValue({
      ...mockBooking,
      start_at: "2026-11-28T07:00:00Z",
      end_at: "2026-11-28T08:00:00Z",
      status: "pending",
      status_display: "Pending",
    });
  });

  it("shows a loading message while bookings are being fetched", () => {
    vi.mocked(fetchCustomerBookings).mockReturnValue(
      new Promise(() => {}),
    );

    renderPage();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays booking details and its current status", async () => {
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

    expect(
      screen.queryByRole("button", { name: /cancel booking/i }),
    ).not.toBeInTheDocument();
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

  it("shows reschedule and cancel actions for pending bookings", async () => {
    renderPage();

    expect(await screen.findByText("Pet Grooming")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /reschedule/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /cancel booking/i }),
    ).toBeInTheDocument();
  });

  it("allows a customer to cancel a booking after confirmation", async () => {
    renderPage();

    await screen.findByText("Pet Grooming");

    fireEvent.click(
      screen.getByRole("button", { name: /cancel booking/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /cancel booking/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /confirm cancellation/i }),
    );

    expect(cancelCustomerBooking).toHaveBeenCalledWith(123);

    expect(
      await screen.findByText(/cancelled successfully/i),
    ).toBeInTheDocument();

    expect(screen.getByText("Cancelled")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /cancel booking/i }),
    ).not.toBeInTheDocument();
  });

  it("allows a customer to reschedule a booking", async () => {
    renderPage();

    await screen.findByText("Pet Grooming");

    fireEvent.click(
      screen.getByRole("button", { name: /reschedule/i }),
    );

    expect(
      await screen.findByRole("dialog", { name: /reschedule booking/i }),
    ).toBeInTheDocument();

    const dateInput = screen.getByLabelText("New appointment date");

    fireEvent.change(dateInput, {
      target: { value: "2026-11-28" },
    });

    await waitFor(() => {
      expect(fetchServiceAvailableTimes).toHaveBeenCalledWith(
        12,
        "2026-11-28",
      );
    });

    const timeSelect = screen.getByLabelText(
      "Available appointment times",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /10:00/i }),
      ).toBeInTheDocument();
    });

    fireEvent.change(timeSelect, {
      target: { value: "2026-11-28T07:00:00Z" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /confirm new time/i }),
    );

    await waitFor(() => {
      expect(rescheduleCustomerBooking).toHaveBeenCalledWith(
        123,
        "2026-11-28T07:00:00Z",
      );
    });

    expect(
      await screen.findByText(/awaiting vendor approval/i),
    ).toBeInTheDocument();

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("does not show management actions for completed bookings", async () => {
    vi.mocked(fetchCustomerBookings).mockResolvedValue([
      {
        ...mockBooking,
        status: "completed",
        status_display: "Completed",
      },
    ]);

    renderPage();

    expect(await screen.findByText("Pet Grooming")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /reschedule/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /cancel booking/i }),
    ).not.toBeInTheDocument();
  });
});

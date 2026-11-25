
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { fetchServiceById } from "../../services/publicServicesApi";
import {
  fetchServiceAvailableTimes,
  createServiceBooking,
} from "../../services/bookings/bookingApi";
import { getSessionRole } from "../../services/auth/authStorage";

import ServiceDetailsPage from "./ServiceDetailsPage";

// Mock the service details API.
vi.mock("../../services/publicServicesApi", () => ({
  fetchServiceById: vi.fn(),
}));

// Mock the booking API.
vi.mock("../../services/bookings/bookingApi", () => ({
  fetchServiceAvailableTimes: vi.fn(),
  createServiceBooking: vi.fn(),
}));

// Mock the review API.
// This prevents the review component from making real backend requests
// while testing the service booking workflow.
vi.mock("../../services/reviews/reviewApi", () => ({
  fetchItemReviews: vi.fn().mockResolvedValue({
    count: 0,
    next: null,
    previous: null,
    results: [],
    summary: {
      average_rating: null,
      review_count: 0,
    },
  }),

  checkReviewEligibility: vi.fn().mockResolvedValue({
    can_review: false,
    reason: "You can review a service after your booking is completed.",
  }),

  submitReview: vi.fn(),
}));

// Mock the authentication role.
vi.mock("../../services/auth/authStorage", () => ({
  getSessionRole: vi.fn(),
}));

const service = {
  service_id: 12,
  name: "Pet Grooming",
  service_type: "Grooming",
  description: "Professional grooming for your pet.",
  price: "50000.00",
  duration: 60,
  availability_status: "available",
  category_name: "Grooming",
  business_name: "Happy Paws Clinic",
  city_district: "Kampala",
  image: null,
  average_rating: 4.8,
  review_count: 20,
};

const availableTimes = [
  "2026-11-26T09:00:00+03:00",
  "2026-11-26T10:00:00+03:00",
];

const bookingResponse = {
  booking_id: 123,
  service: 12,
  service_name: "Pet Grooming",
  start_at: availableTimes[0],
  end_at: "2026-11-26T10:00:00+03:00",
  status: "pending" as const,
  status_display: "Pending",
  notes: "My dog needs grooming.",
  decision_reason: "",
  created_at: "2026-11-24T10:00:00+03:00",
};

// Displays the navigation state after a guest is redirected to login.
function LoginLocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="login-location">
      {JSON.stringify(location.state)}
    </div>
  );
}

// Render the service details page inside a test router.
function renderPage(initialEntry = "/services/12") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/services/:serviceId"
          element={<ServiceDetailsPage />}
        />

        <Route
          path="/login"
          element={<LoginLocationProbe />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ServiceDetailsPage booking workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchServiceById).mockResolvedValue(service);

    vi.mocked(fetchServiceAvailableTimes).mockImplementation(
      async (serviceId, date) => ({
        service_id: serviceId,
        date,
        duration: 60,
        times: availableTimes,
      }),
    );

    vi.mocked(getSessionRole).mockReturnValue("CUSTOMER");
  });

  it("loads service details and available appointment times", async () => {
    renderPage("/services/12?bookingDate=2026-11-26");

    expect(
      await screen.findByRole("heading", { name: "Pet Grooming" }),
    ).toBeInTheDocument();

    expect(fetchServiceById).toHaveBeenCalledWith("12");

    expect(fetchServiceAvailableTimes).toHaveBeenCalledWith(
      12,
      "2026-11-26",
    );

    expect(
      screen.getByText("Professional grooming for your pet."),
    ).toBeInTheDocument();

    expect(screen.getByText("Happy Paws Clinic")).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: /9:00/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /10:00/i }),
    ).toBeInTheDocument();
  });

  it("fetches new available times when the customer changes the date", async () => {
    renderPage("/services/12?bookingDate=2026-11-26");

    await screen.findByRole("heading", { name: "Pet Grooming" });

    const dateInput = screen.getByLabelText(/date/i);

    fireEvent.change(dateInput, {
      target: { value: "2026-11-27" },
    });

    await waitFor(() => {
      expect(fetchServiceAvailableTimes).toHaveBeenLastCalledWith(
        12,
        "2026-11-27",
      );
    });
  });

  it("allows guests to browse times and select an appointment without logging in", async () => {
    vi.mocked(getSessionRole).mockReturnValue(null);

    renderPage("/services/12?bookingDate=2026-11-26");

    const timeButton = await screen.findByRole("button", {
      name: /9:00/i,
    });

    fireEvent.click(timeButton);

    expect(timeButton).toHaveAttribute("aria-pressed", "true");

    // Browsing and selecting a time should not redirect a guest.
    expect(screen.queryByTestId("login-location")).not.toBeInTheDocument();
  });

  it("redirects a guest to login only when they confirm a booking", async () => {
    vi.mocked(getSessionRole).mockReturnValue(null);

    renderPage("/services/12?bookingDate=2026-11-26");

    const timeButton = await screen.findByRole("button", {
      name: /9:00/i,
    });

    fireEvent.click(timeButton);

    fireEvent.click(
      screen.getByRole("button", { name: /confirm booking/i }),
    );

    expect(await screen.findByTestId("login-location")).toBeInTheDocument();

    const navigationState = JSON.parse(
      screen.getByTestId("login-location").textContent || "{}",
    );

    expect(navigationState.from.pathname).toBe("/services/12");

    expect(navigationState.from.search).toContain(
      "bookingDate=2026-11-26",
    );

    expect(navigationState.from.search).toContain(
      "bookingTime=",
    );

    // Guests must not submit bookings.
    expect(createServiceBooking).not.toHaveBeenCalled();
  });

  it("submits a booking with the selected time and customer notes", async () => {
    vi.mocked(createServiceBooking).mockResolvedValue(bookingResponse);

    renderPage("/services/12?bookingDate=2026-11-26");

    const timeButton = await screen.findByRole("button", {
      name: /9:00/i,
    });

    fireEvent.click(timeButton);

    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: "  My dog needs grooming.  " },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /confirm booking/i }),
    );

    await waitFor(() => {
      expect(createServiceBooking).toHaveBeenCalledWith({
        service: 12,
        start_at: "2026-11-26T09:00:00+03:00",
        notes: "My dog needs grooming.",
      });
    });

    expect(
  await screen.findByText(/Booking reference: #123/),
  ).toBeInTheDocument();
  });

  it("displays an error when booking submission fails", async () => {
    vi.mocked(createServiceBooking).mockRejectedValue(
      new Error("This appointment is no longer available."),
    );

    renderPage("/services/12?bookingDate=2026-11-26");

    const timeButton = await screen.findByRole("button", {
      name: /9:00/i,
    });

    fireEvent.click(timeButton);

    fireEvent.click(
      screen.getByRole("button", { name: /confirm booking/i }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("This appointment is no longer available.");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ServicesPage from "./ServicesPage";
import { fetchServices, getCategories } from "../../services/publicServicesApi";

vi.mock("../../services/publicServicesApi", () => ({ fetchServices: vi.fn(), getCategories: vi.fn() }));

const service = {
  service_id: 18, name: "Gentle grooming", service_type: "Grooming", description: "Wash and brush.",
  price: "50000", duration: 60, availability_status: "unavailable", category_name: "Grooming",
  business_name: "Paws Clinic", city_district: "Kampala", image: "https://img.test/groom.jpg",
  average_rating: 4.5, review_count: 2,
};
const page = (count: number, results = [service]) => ({ count, next: null, previous: null, results });

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("ServicesPage", () => {
  it("shows service details, image and the actual unavailable state", async () => {
    vi.mocked(fetchServices).mockResolvedValue(page(1));
    vi.mocked(getCategories).mockResolvedValue([]);
    render(<MemoryRouter><ServicesPage /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Gentle grooming" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Gentle grooming" })).toHaveAttribute("src", service.image);
    expect(screen.getByText("Paws Clinic")).toBeInTheDocument();
    expect(screen.getByText("UGX 50,000")).toBeInTheDocument();
    expect(screen.getByText("unavailable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/services/18");
  });

  it("shows an empty state when there are no approved services", async () => {
    vi.mocked(fetchServices).mockResolvedValue(page(0, []));
    vi.mocked(getCategories).mockResolvedValue([]);
    render(<MemoryRouter><ServicesPage /></MemoryRouter>);
    expect(await screen.findByText("No services available yet")).toBeInTheDocument();
  });

  it("shows a retryable error state", async () => {
    vi.mocked(fetchServices).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(page(1));
    vi.mocked(getCategories).mockResolvedValue([]);
    render(<MemoryRouter><ServicesPage /></MemoryRouter>);
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load pet services");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Gentle grooming" })).toBeInTheDocument();
    await waitFor(() => expect(fetchServices).toHaveBeenCalledTimes(2));
  });

  it("loads the next page when pagination is used", async () => {
    vi.mocked(fetchServices).mockResolvedValue(page(13));
    vi.mocked(getCategories).mockResolvedValue([]);
    render(<MemoryRouter><ServicesPage /></MemoryRouter>);
    await screen.findByRole("heading", { name: "Gentle grooming" });
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(fetchServices).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });
});

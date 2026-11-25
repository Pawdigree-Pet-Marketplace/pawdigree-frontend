import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Services from "./Services";
import { fetchServices } from "../../services/publicServicesApi";
import type { PagedServices, Service } from "../../data/services";

vi.mock("../../services/publicServicesApi", () => ({ fetchServices: vi.fn() }));

class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = [];
  readonly observed: Element[] = [];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    TestIntersectionObserver.instances.push(this);
  }

  observe = (element: Element) => { this.observed.push(element); };
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];

  trigger(element: Element, isIntersecting: boolean) {
    this.callback(
      [{ target: element, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const service = (id: number): Service => ({
  service_id: id,
  name: `Service ${id}`,
  service_type: "Grooming",
  description: `Care description ${id}`,
  price: "50000.00",
  duration: 60,
  availability_status: "available",
  category_name: "Grooming",
  business_name: "Paws Clinic",
  city_district: "Kampala",
  image: `https://media.pawdigree.test/services/${id}.jpg`,
  average_rating: 4.5,
  review_count: 2,
});

function response(results: Service[]): PagedServices {
  return { count: results.length, next: null, previous: null, results };
}

function renderSection() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Services />} />
        <Route path="/services" element={<h1>All services</h1>} />
        <Route path="/services/:serviceId" element={<h1>Service details</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  TestIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
  vi.mocked(fetchServices).mockResolvedValue(response([]));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("homepage public services", () => {
  it("loads real services and displays the first four with their public details", async () => {
    vi.mocked(fetchServices).mockResolvedValue(response([1, 2, 3, 4, 5].map(service)));

    renderSection();

    expect(await screen.findByRole("heading", { name: "Service 1" })).toBeInTheDocument();
    for (let id = 2; id <= 4; id += 1) {
      expect(screen.getByRole("heading", { name: `Service ${id}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { name: "Service 5" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Paws Clinic")).toHaveLength(4);
    expect(screen.getAllByText("UGX 50,000")).toHaveLength(4);
    expect(screen.getAllByText("1 hour")).toHaveLength(4);
    expect(screen.getAllByText("Kampala")).toHaveLength(4);
    expect(screen.getAllByText("4.5 (2)")).toHaveLength(4);
    expect(fetchServices).toHaveBeenCalledWith({
      search: "", category: "", cityDistrict: "", minPrice: "", maxPrice: "", page: 1,
    });
  });

  it("reruns scroll reveal after asynchronously loaded cards are inserted", async () => {
    let resolveServices!: (data: PagedServices) => void;
    vi.mocked(fetchServices).mockReturnValue(new Promise((resolve) => { resolveServices = resolve; }));

    renderSection();
    expect(screen.getByRole("status")).toHaveTextContent("Loading public services");

    await act(async () => { resolveServices(response([service(1)])); });

    const card = screen.getByRole("link", { name: /service 1/i });
    const observer = TestIntersectionObserver.instances.at(-1);
    expect(observer?.observed).toContain(card);
    act(() => observer?.trigger(card, true));
    expect(card).toHaveClass("is-visible");
  });

  it("falls back when the service image is missing or fails to load", async () => {
    vi.mocked(fetchServices).mockResolvedValue(response([
      { ...service(1), image: null },
      service(2),
    ]));

    renderSection();

    expect(await screen.findByText("Pet service")).toBeInTheDocument();
    fireEvent.error(screen.getByRole("img", { name: "Service 2" }));
    expect(screen.getAllByText("Pet service")).toHaveLength(2);
  });

  it("shows a clear empty state when the public endpoint returns no services", async () => {
    renderSection();
    expect(await screen.findByText("No public services are available yet.")).toBeInTheDocument();
  });

  it("shows an error and retries the public services request", async () => {
    vi.mocked(fetchServices)
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(response([service(1)]));

    renderSection();
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn’t load services right now.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Service 1" })).toBeInTheDocument();
    expect(fetchServices).toHaveBeenCalledTimes(2);
  });

  it("links to the service directory and the corresponding service detail route", async () => {
    vi.mocked(fetchServices).mockResolvedValue(response([service(1)]));

    renderSection();
    fireEvent.click(await screen.findByRole("link", { name: "See All Services" }));
    expect(await screen.findByRole("heading", { name: "All services" })).toBeInTheDocument();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Services />} />
          <Route path="/services/:serviceId" element={<h1>Service details</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("link", { name: /service 1/i }));
    expect(await screen.findByRole("heading", { name: "Service details" })).toBeInTheDocument();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ExplorePets from "./ExplorePets";
import {
  fetchFeatured,
  fetchPets,
  fetchSuggestions,
  fetchTrendingSearches,
} from "../../services/petsApi";
import type { PublicPet } from "../../data/pets";

vi.mock("../../services/petsApi", () => ({
  fetchPets: vi.fn(),
  fetchFeatured: vi.fn(),
  fetchTrendingSearches: vi.fn(),
  fetchSuggestions: vi.fn(),
}));

vi.mock(
  "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar",
  () => ({
    default: () => <nav aria-label="Main navigation" />,
  }),
);

function makePet(overrides: Partial<PublicPet> = {}): PublicPet {
  return {
    pet_id: 1,
    name: "Rex",
    species: "Dog",
    breed: "Labrador",
    age: 14,
    gender: "MALE",
    listing_type: "SALE",
    price: "250000.00",
    business_name: "Sunrise Pet Haven",
    images: [],
    ...overrides,
  };
}

const rex = makePet();
const amber = makePet({
  pet_id: 2,
  name: "Amber",
  species: "Cat",
  breed: "Persian",
  gender: "FEMALE",
  listing_type: "ADOPTION",
  price: null,
});

beforeEach(() => {
  // jsdom does not implement these browser APIs
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  Element.prototype.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", "/explore-pets");
  localStorage.clear();

  vi.mocked(fetchPets).mockResolvedValue({ count: 2, results: [rex, amber] });
  vi.mocked(fetchFeatured).mockResolvedValue([]);
  vi.mocked(fetchTrendingSearches).mockResolvedValue([]);
  vi.mocked(fetchSuggestions).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ExplorePets page", () => {
  it("shows the heading and the pets returned by the API", async () => {
    render(<ExplorePets />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Explore Pets" }),
    ).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Rex" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Amber" })).toBeTruthy();
    expect(screen.getByText("Showing 1–2 of 2 pets")).toBeTruthy();
  });

  it("asks the API for the first page on load", async () => {
    render(<ExplorePets />);
    await screen.findByRole("heading", { name: "Rex" });

    expect(fetchPets).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, search: "", species: [] }),
    );
  });

  it("shows an empty state when there are no pets", async () => {
    vi.mocked(fetchPets).mockResolvedValue({ count: 0, results: [] });
    render(<ExplorePets />);

    expect(await screen.findByText("No pets listed yet")).toBeTruthy();
  });

  it("shows an error and loads again when Try again is clicked", async () => {
    vi.mocked(fetchPets).mockRejectedValueOnce(new Error("network"));
    render(<ExplorePets />);

    expect(await screen.findByText(/couldn.t load the pets/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Rex" })).toBeTruthy();
  });

  it("searches when the search form is submitted", async () => {
    render(<ExplorePets />);
    await screen.findByRole("heading", { name: "Rex" });

    const input = screen.getByLabelText(
      "Search pets, breeds, locations or vendors",
    );
    fireEvent.change(input, { target: { value: "chinchilla rabbit" } });
    fireEvent.click(screen.getByRole("button", { name: "Search pets" }));

    await waitFor(() =>
      expect(fetchPets).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "chinchilla rabbit", page: 1 }),
      ),
    );
    expect(window.location.search).toContain("search=chinchilla+rabbit");
  });

  it("filters by species from the quick picks and shows a removable chip", async () => {
    render(<ExplorePets />);
    await screen.findByRole("heading", { name: "Rex" });

    fireEvent.click(screen.getByRole("button", { name: "Dogs" }));

    await waitFor(() =>
      expect(fetchPets).toHaveBeenLastCalledWith(
        expect.objectContaining({ species: ["dog"] }),
      ),
    );

    // the chip appears; removing it clears the filter
    const chip = await screen.findByRole("button", {
      name: /Remove filter Dogs/,
    });
    fireEvent.click(chip);
    await waitFor(() =>
      expect(fetchPets).toHaveBeenLastCalledWith(
        expect.objectContaining({ species: [] }),
      ),
    );
  });

  it("shows Top picks on the clean view and hides them once a filter is active", async () => {
    const pick = {
      ...makePet({ pet_id: 3, name: "Bella" }),
      reason: "Just listed",
    };
    vi.mocked(fetchFeatured).mockResolvedValue([pick]);
    render(<ExplorePets />);

    expect(
      await screen.findByRole("heading", { name: "Top picks" }),
    ).toBeTruthy();
    expect(await screen.findByText(/Top pick · Just listed/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dogs" }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Top picks" })).toBeNull(),
    );
  });

  it("goes to the next page with the pagination buttons", async () => {
    vi.mocked(fetchPets).mockResolvedValue({
      count: 30,
      results: [rex, amber],
    });
    render(<ExplorePets />);
    await screen.findByRole("heading", { name: "Rex" });

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() =>
      expect(fetchPets).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
  });

  it("saves a pet to favourites and remembers it", async () => {
    render(<ExplorePets />);
    await screen.findByRole("heading", { name: "Rex" });

    const heart = screen.getByRole("button", {
      name: "Save Rex to favourites",
    });
    expect(heart.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(heart);

    const saved = screen.getByRole("button", {
      name: "Remove Rex from favourites",
    });
    expect(saved.getAttribute("aria-pressed")).toBe("true");
    expect(
      JSON.parse(localStorage.getItem("pawdigree:favourites") ?? "[]"),
    ).toEqual([1]);
  });

  it("links each card to its detail page", async () => {
    render(<ExplorePets />);
    await screen.findByRole("heading", { name: "Rex" });

    const links = screen.getAllByRole("link", { name: "View details" });
    expect(links[0].getAttribute("href")).toBe("/pets/1");
  });
});

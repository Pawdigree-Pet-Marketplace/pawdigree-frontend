
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useSearchParams,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { PublicPet } from "../../data/pets";
import { fetchPet } from "../../services/petsApi";
import AdoptionRequest from "./AdoptionRequest";

vi.mock("../../services/petsApi", () => ({
  fetchPet: vi.fn(),
}));

function ChangePetSelection() {
  const [, setSearchParams] = useSearchParams();

  return (
    <button
      type="button"
      onClick={() => setSearchParams({ pet_id: "456" })}
    >
      Select another pet
    </button>
  );
}

const mockPet = (id: number, name: string): PublicPet =>
  ({
    id,
    pet_id: id,
    name,
    listing_type: "ADOPTION",
    species: "DOG",
    age: 2,
    gender: "MALE",
    images: [],
  }) as unknown as PublicPet;

describe("AdoptionRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchPet).mockImplementation(async (id) => {
      return mockPet(Number(id), `Pet ${id}`);
    });
  });

  it("updates the selected pet when the query parameter changes", async () => {
    render(
      <MemoryRouter initialEntries={["/adoption-request?pet_id=123"]}>
        <Routes>
          <Route
            path="/adoption-request"
            element={
              <>
                <ChangePetSelection />
                <AdoptionRequest />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Adopt Pet 123")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select another pet" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Adopt Pet 456")).toBeInTheDocument();
    });

    expect(fetchPet).toHaveBeenCalledWith("123");
    expect(fetchPet).toHaveBeenCalledWith("456");
  });
});

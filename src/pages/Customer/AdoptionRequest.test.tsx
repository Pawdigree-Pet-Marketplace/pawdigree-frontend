import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import AdoptionRequest from "./AdoptionRequest";

function ChangePetSelection() {
  const [, setSearchParams] = useSearchParams();

  return (
    <button type="button" onClick={() => setSearchParams({ pet_id: "456" })}>
      Select another pet
    </button>
  );
}

describe("AdoptionRequest", () => {
  it("updates the selected pet when the query parameter changes", () => {
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

    expect(screen.getByText(/Pet ID:/)).toHaveTextContent("123");

    fireEvent.click(screen.getByRole("button", { name: "Select another pet" }));

    expect(screen.getByText(/Pet ID:/)).toHaveTextContent("456");
  });
});

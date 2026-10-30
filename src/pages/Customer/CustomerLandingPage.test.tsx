import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "./CustomerLandingPage";

describe("LandingPage", () => {
  it("renders the main landing page content", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: /find your next pet from verified sellers near you/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("searchbox", {
        name: /search pets, services, products/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("button", {
        name: /create account/i,
      }),
    ).toHaveLength(1);
  });
});

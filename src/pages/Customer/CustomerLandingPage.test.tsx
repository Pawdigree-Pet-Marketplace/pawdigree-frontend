import { render as rtlRender, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LandingPage from "./CustomerLandingPage";

const render = (ui: React.ReactNode) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

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
      screen.getAllByRole("link", {
        name: /create account/i,
      }),
    ).toHaveLength(1);
  });
});

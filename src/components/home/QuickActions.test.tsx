import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import QuickActions from "./QuickActions";

function Destination() {
  const location = useLocation();
  return <p role="status">{location.pathname}{location.search}</p>;
}

const destinations = [
  ["Meet Vendors", "/vendors"],
  ["Adoption", "/explore-pets?listing_type=adoption"],
] as const;

describe("QuickActions", () => {
  it.each(destinations)("navigates %s to its public destination", async (label, destination) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<QuickActions />} />
          <Route path="*" element={<Destination />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: new RegExp(label, "i") }));
    expect(screen.getByRole("status")).toHaveTextContent(destination);
  });

  it("shows only the two requested cards and no introductory heading", () => {
    const { container } = render(<MemoryRouter><QuickActions /></MemoryRouter>);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(screen.getByRole("link", { name: /meet vendors/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /adoption/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /explore pets|shop products|find services/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/your next step|explore pawdigree/i)).not.toBeInTheDocument();
    expect(container.querySelector(".quick-actions-grid")).toHaveClass("quick-actions-grid");
  });
});

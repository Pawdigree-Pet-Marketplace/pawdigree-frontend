import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Suggestion } from "../../data/pets";
import Typeahead from "./Typeahead";

const suggestions: Suggestion[] = [
  { kind: "business", label: "Ari Havens", hint: "Kampala", image: "/business.png", href: "/vendors/business-uuid" },
  { kind: "pet", label: "Ari", hint: "Mixed breed", image: "/pet.png", href: "/pets/12" },
  { kind: "product", label: "Ari collar", hint: "UGX 25,000", image: "/product.png", href: "/merchandise/9" },
  { kind: "service", label: "Ari grooming", hint: "Grooming", image: "/service.png", href: "/services/4" },
];

function SearchHarness({ loader = async () => suggestions }: { loader?: (query: string, signal?: AbortSignal) => Promise<Suggestion[]> }) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <form onSubmit={(event) => event.preventDefault()}>
        <Typeahead
          label="Search Pawdigree"
          value={value}
          onChange={setValue}
          onPick={(item) => navigate(item.href || "/")}
          loadSuggestions={loader}
          onSubmit={(query) => navigate(`/explore-pets?search=${encodeURIComponent(query)}`)}
          minQueryLength={2}
          emptyText="No marketplace matches."
          submitHint="Search shows pet matches."
          variant="field"
        />
      </form>
      <output data-testid="location">{location.pathname}{location.search}</output>
      <button type="button">Outside</button>
    </>
  );
}

function Destination() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderSearch(loader?: (query: string, signal?: AbortSignal) => Promise<Suggestion[]>) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<SearchHarness loader={loader} />} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Typeahead marketplace behavior", () => {
  it("groups, highlights and keyboard-selects results to their specific detail routes", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("combobox", { name: "Search Pawdigree" });
    await user.type(input, "Ari");

    expect(await screen.findByText("Businesses")).toBeInTheDocument();
    expect(screen.getByText("Pets")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(document.querySelector(".ta__match")).toHaveTextContent("Ari");

    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByTestId("location")).toHaveTextContent("/vendors/business-uuid");
  });

  it("renders each resource type in the same icon, title, detail and thumbnail order", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByRole("combobox", { name: "Search Pawdigree" }), "Ari");
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(4);
    options.forEach((option) => {
      const children = Array.from(option.children);
      expect(children[0]).toHaveClass("ta__type-icon");
      expect(children[1]).toHaveClass("ta__text");
      expect(children[2]).toHaveClass("ta__hint");
      expect(children[3]).toHaveClass("ta__thumb");
    });
  });

  it("selects a result with pointer input and closes on outside interaction", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByRole("combobox"), "Ari");
    await user.click(await screen.findByRole("option", { name: /Ari grooming/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/services/4");
  });

  it.each([
    ["Ari Havens", "/vendors/business-uuid", /Ari Havens/],
    ["Ari", "/pets/12", /Mixed breed/],
    ["Ari collar", "/merchandise/9", /Ari collar/],
    ["Ari grooming", "/services/4", /Ari grooming/],
  ])("opens the %s result directly", async (_label, href, optionName) => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByRole("combobox"), "Ari");
    await user.click(await screen.findByRole("option", { name: optionName }));
    expect(screen.getByTestId("location")).toHaveTextContent(href);
  });

  it("shows empty and useful API error states and does not call the loader for one character", async () => {
    const loader = vi.fn(async () => [] as Suggestion[]);
    const user = userEvent.setup();
    renderSearch(loader);
    const input = screen.getByRole("combobox");
    await user.type(input, "A");
    expect(loader).not.toHaveBeenCalled();
    await user.type(input, "r");
    expect(await screen.findByText("No marketplace matches.")).toBeInTheDocument();

    const failingLoader = vi.fn(async () => { throw new Error("Search service is temporarily offline."); });
    renderSearch(failingLoader);
    await user.type(screen.getAllByRole("combobox")[1], "Ari");
    expect(await screen.findByText("Search service is temporarily offline.")).toBeInTheDocument();
  });

  it("ignores a late response for an older query", async () => {
    let resolveOld!: (items: Suggestion[]) => void;
    const loader: (query: string, signal?: AbortSignal) => Promise<Suggestion[]> = vi.fn((query: string) => query === "Ar"
      ? new Promise<Suggestion[]>((resolve) => { resolveOld = resolve; })
      : Promise.resolve([{ kind: "pet", label: "Ari newer", href: "/pets/88" }] as Suggestion[]));
    const user = userEvent.setup();
    renderSearch(loader);
    const input = screen.getByRole("combobox");
    await user.type(input, "Ar");
    await waitFor(() => expect(loader).toHaveBeenCalledWith("Ar", expect.any(AbortSignal)));
    await user.type(input, "i");
    expect(await screen.findByRole("option", { name: /Ari newer/i })).toBeInTheDocument();
    resolveOld([{ kind: "business", label: "Ar old result", href: "/vendors/old" }]);
    await waitFor(() => expect(screen.queryByRole("option", { name: /old result/i })).not.toBeInTheDocument());
    expect(screen.getByRole("option", { name: /Ari newer/i })).toBeInTheDocument();
  });

  it("closes its menu when the user clicks outside", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByRole("combobox"), "Ari");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdoptionRequests from "./AdoptionRequests";
import { customerAuthenticatedFetch } from "../../../services/customerAuthenticatedFetch";

vi.mock("../../../services/customerAuthenticatedFetch", () => ({
  customerAuthenticatedFetch: vi.fn(),
}));

const APPLICATIONS_URL = "/api/adoptions/my-applications/";

const applications = [
  {
    application_id: "app-pending",
    pet: 5,
    status: "PENDING",
    created_at: "2026-10-01T10:00:00Z",
    home_type: "HOUSE",
    has_outdoor_space: true,
    message: "I have always wanted a Labrador.",
  },
  {
    application_id: "app-approved",
    pet: 6,
    status: "APPROVED",
    created_at: "2026-10-03T10:00:00Z",
  },
  {
    application_id: "app-rejected",
    pet: 7,
    status: "REJECTED",
    created_at: "2026-10-02T10:00:00Z",
    rejection_reason: "Home is too small for this breed.",
  },
];

const pets: Record<number, Record<string, string>> = {
  5: { name: "Bella", breed: "Labrador", business_name: "Happy Paws" },
  6: { name: "Max", breed: "Poodle", business_name: "Pet Haven" },
  7: { name: "Rocky", breed: "Bulldog", business_name: "Furry Friends" },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockApi(apps: unknown = applications, appsStatus = 200) {
  vi.mocked(customerAuthenticatedFetch).mockImplementation(async (url) => {
    if (String(url) === APPLICATIONS_URL) return json(apps, appsStatus);
    const match = String(url).match(/^\/api\/pets\/public\/(\d+)\/$/);
    const pet = match ? pets[Number(match[1])] : undefined;
    return pet ? json(pet) : json({}, 404);
  });
}

function RouteSearch() {
  return <output data-testid="route-search">{useLocation().search}</output>;
}

function renderRequests(
  path = "/customer/adoption?view=requests",
  onFindPet = vi.fn(),
) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AdoptionRequests onFindPet={onFindPet} />
      <RouteSearch />
    </MemoryRouter>,
  );
  return { onFindPet };
}

async function renderLoaded(path?: string) {
  const utils = renderRequests(path);
  // Wait until pet names have been merged in. When a request is open the
  // name shows twice (list row and detail card), so use the plural query.
  await screen.findAllByText("Bella · Labrador");
  await screen.findAllByText("Max · Poodle");
  await screen.findAllByText("Rocky · Bulldog");
  return utils;
}

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }) as unknown as typeof window.matchMedia;
}

describe("Customer adoption requests", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    mockApi();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("loading the list", () => {
    it("shows a loading message first", () => {
      renderRequests();
      expect(screen.getByText("Loading your requests…")).toBeInTheDocument();
    });

    it("loads applications, then fills in each pet's details", async () => {
      await renderLoaded();

      expect(customerAuthenticatedFetch).toHaveBeenCalledWith(APPLICATIONS_URL);
      expect(customerAuthenticatedFetch).toHaveBeenCalledWith(
        "/api/pets/public/5/",
      );
      expect(screen.getByText(/Happy Paws/)).toBeInTheDocument();
    });

    it("lists the newest request first", async () => {
      await renderLoaded();

      const list = screen.getByRole("list");
      const names = within(list)
        .getAllByRole("button")
        .map((button) => button.textContent ?? "");

      expect(names[0]).toContain("Max");
      expect(names[1]).toContain("Rocky");
      expect(names[2]).toContain("Bella");
    });

    it("accepts a paginated response and looks each pet up only once", async () => {
      mockApi({
        results: [
          applications[0],
          { ...applications[0], application_id: "app-second" },
        ],
      });
      renderRequests();

      await waitFor(() =>
        expect(screen.getAllByText("Bella · Labrador")).toHaveLength(2),
      );
      const petLookups = vi
        .mocked(customerAuthenticatedFetch)
        .mock.calls.filter(([url]) => url === "/api/pets/public/5/");
      expect(petLookups).toHaveLength(1);
    });
  });

  describe("empty and error states", () => {
    it("invites the customer to find a pet when there are no requests", async () => {
      mockApi([]);
      const { onFindPet } = renderRequests();

      expect(await screen.findByText("No requests yet")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Find a pet" }));
      expect(onFindPet).toHaveBeenCalledTimes(1);
    });

    it("explains an expired session", async () => {
      mockApi({}, 401);
      renderRequests();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Your session has expired. Please sign in again.",
      );
    });

    it("lets the customer retry after a failed load", async () => {
      mockApi({}, 500);
      renderRequests();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "We couldn’t load your adoption requests.",
      );

      mockApi();
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));

      expect(await screen.findByText("Bella · Labrador")).toBeInTheDocument();
    });

    it("refreshes the list on demand", async () => {
      await renderLoaded();
      const before = vi
        .mocked(customerAuthenticatedFetch)
        .mock.calls.filter(([url]) => url === APPLICATIONS_URL).length;

      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

      await waitFor(() => {
        const after = vi
          .mocked(customerAuthenticatedFetch)
          .mock.calls.filter(([url]) => url === APPLICATIONS_URL).length;
        expect(after).toBe(before + 1);
      });
    });
  });

  describe("filters", () => {
    it("shows a count on each filter", async () => {
      await renderLoaded();

      expect(
        screen.getByRole("button", { name: /^All\s*3$/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Pending\s*1$/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Approved\s*1$/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Cancelled\s*0$/ }),
      ).toBeInTheDocument();
    });

    it("narrows the list to the chosen status", async () => {
      await renderLoaded();
      fireEvent.click(screen.getByRole("button", { name: /^Approved/ }));

      expect(screen.getByText("Max · Poodle")).toBeInTheDocument();
      expect(screen.queryByText("Bella · Labrador")).not.toBeInTheDocument();
      expect(screen.queryByText("Rocky · Bulldog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Approved/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("counts 'info requested' as pending", async () => {
      mockApi([{ ...applications[0], status: "INFO_REQUESTED" }]);
      renderRequests();
      await screen.findByText("Bella · Labrador");

      expect(
        screen.getByRole("button", { name: /^Pending\s*1$/ }),
      ).toBeInTheDocument();
    });

    it("offers a way back when a filter matches nothing", async () => {
      await renderLoaded();
      fireEvent.click(screen.getByRole("button", { name: /^Cancelled/ }));

      expect(screen.getByText("No cancelled requests")).toBeInTheDocument();
      fireEvent.click(
        screen.getByRole("button", { name: "Show all requests" }),
      );
      expect(screen.getByText("Bella · Labrador")).toBeInTheDocument();
    });
  });

  describe("request details", () => {
    it("prompts the customer to pick a request when none is open", async () => {
      await renderLoaded();
      expect(screen.getByText("Select a request")).toBeInTheDocument();
    });

    it("opens a request and puts it in the URL", async () => {
      await renderLoaded();
      fireEvent.click(screen.getByRole("button", { name: /Bella · Labrador/ }));

      expect(screen.getByTestId("route-search")).toHaveTextContent(
        "request=app-pending",
      );
      expect(screen.getByTestId("route-search")).toHaveTextContent(
        "view=requests",
      );
      expect(
        screen.getByRole("heading", { name: "Application status" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Application pending")).toBeInTheDocument();
    });

    it("shows the timeline for the request", async () => {
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-pending",
      );

      const timeline = screen.getByRole("region", {
        name: "Application timeline",
      });
      expect(
        within(timeline).getByText("Application submitted"),
      ).toBeInTheDocument();
      expect(within(timeline).getByText("Vendor review")).toBeInTheDocument();
      expect(within(timeline).getByText("Vendor decision")).toBeInTheDocument();
    });

    it("shows the answers the customer gave", async () => {
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-pending",
      );

      const answers = screen.getByRole("region", { name: "Your application" });
      expect(within(answers).getByText("House")).toBeInTheDocument();
      expect(
        within(answers).getByText("I have always wanted a Labrador."),
      ).toBeInTheDocument();
    });

    it("links to the pet", async () => {
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-pending",
      );

      expect(screen.getByRole("link", { name: /View pet/ })).toHaveAttribute(
        "href",
        "/pets/5",
      );
    });

    it("shows the vendor's message on a rejected request", async () => {
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-rejected",
      );

      expect(screen.getByText("Application not approved")).toBeInTheDocument();
      expect(
        screen.getByText(/Home is too small for this breed\./),
      ).toBeInTheDocument();
      expect(screen.getByText("Not approved")).toBeInTheDocument();
    });

    it("shows the approved banner and next steps", async () => {
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-approved",
      );

      expect(screen.getByText("Application approved")).toBeInTheDocument();
      expect(screen.getByText("Delivery / pickup")).toBeInTheDocument();
    });

    it("goes back to the list from the detail view", async () => {
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-pending",
      );
      fireEvent.click(screen.getByRole("button", { name: /All requests/ }));

      expect(screen.getByTestId("route-search")).not.toHaveTextContent(
        "request=",
      );
      expect(screen.getByText("Select a request")).toBeInTheDocument();
    });

    it("moves focus to the details on small screens", async () => {
      stubMatchMedia(true);
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-pending",
      );

      expect(
        screen.getByRole("heading", { name: "Application status" }),
      ).toHaveFocus();
    });

    it("leaves focus alone on large screens", async () => {
      await renderLoaded(
        "/customer/adoption?view=requests&request=app-pending",
      );

      expect(
        screen.getByRole("heading", { name: "Application status" }),
      ).not.toHaveFocus();
    });
  });

    it("shows the application conversation and submits a reply to an information request", async () => {
      const requestApplication = {
        ...applications[0],
        status: "INFO_REQUESTED",
        info_messages: [{ id: "message-1", kind: "REQUEST", body: "Do you have a fenced yard?", created_at: "2026-10-04T10:00:00Z" }],
      };
      vi.mocked(customerAuthenticatedFetch).mockImplementation(async (url, init) => {
        if (String(url) === APPLICATIONS_URL) return json([requestApplication]);
        if (String(url) === "/api/pets/public/5/") return json(pets[5]);
        if (String(url).includes("/api/adoptions/applications/app-pending/reply/") && init?.method === "POST") return json({});
        return json({}, 404);
      });
      renderRequests("/customer/adoption?view=requests&request=app-pending");

      expect(await screen.findByText("The vendor is waiting for your response.")).toBeInTheDocument();
      expect(screen.getByText("Do you have a fenced yard?")).toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText("Type your response to the vendor..."), { target: { value: "Yes, it is fenced." } });
      fireEvent.click(screen.getByRole("button", { name: "Send Reply" }));

      await waitFor(() => expect(customerAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/adoptions/applications/app-pending/reply/"),
        expect.objectContaining({ method: "POST", body: JSON.stringify({ message: "Yes, it is fenced." }) }),
      ));
      await waitFor(() => expect(vi.mocked(customerAuthenticatedFetch).mock.calls.filter(([url]) => url === APPLICATIONS_URL)).toHaveLength(2));
    });
});

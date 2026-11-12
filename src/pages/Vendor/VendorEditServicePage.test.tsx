import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorEditServicePage from "./VendorEditServicePage";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";

vi.mock("../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({
  vendorAuthenticatedFetch: vi.fn(),
}));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));
vi.mock("../../components/BackButton/BackButton", () => ({
  default: ({ label }: { label: string }) => <a href="/back">{label}</a>,
}));

const SERVICE_URL = "http://api.test/api/services/7/";

const service = {
  id: 7,
  name: "Full grooming",
  description: "Bath, trim and nail clip.",
  category: "GROOMING",
  price_type: "FIXED",
  price: "35000",
  duration: 60,
  service_area: "Within 10 km",
  images: [
    { image_id: 3, image: "http://img.test/a.jpg" },
    { image_id: 4, image: "http://img.test/b.jpg" },
  ],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type Handlers = {
  get?: () => Response;
  patch?: () => Response;
  del?: () => Response;
};

function mockApi({ get, patch, del }: Handlers = {}) {
  vi.mocked(vendorAuthenticatedFetch).mockImplementation(async (_url, init) => {
    const method = init?.method ?? "GET";
    if (method === "PATCH") return patch ? patch() : json(service);
    if (method === "DELETE")
      return del ? del() : new Response(null, { status: 204 });
    return get ? get() : json(service);
  });
}

function callsWithMethod(method: string) {
  return vi
    .mocked(vendorAuthenticatedFetch)
    .mock.calls.filter(([, init]) => init?.method === method);
}

function renderPage(path = "/vendor/services/7/edit") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/vendor/services/:serviceId/edit"
          element={<VendorEditServicePage />}
        />
        <Route path="/vendor/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function renderLoaded() {
  renderPage();
  await screen.findByDisplayValue("Full grooming");
}

describe("Vendor edit service page", () => {
  beforeEach(() => {
    mockApi();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  describe("loading", () => {
    it("fetches the service by id and fills the form", async () => {
      await renderLoaded();

      expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(SERVICE_URL);
      expect(screen.getByLabelText(/service name/i)).toHaveValue(
        "Full grooming",
      );
      expect(screen.getByLabelText("Category")).toHaveValue("GROOMING");
      expect(screen.getByLabelText(/price \(ugx\)/i)).toHaveValue(35000);
      expect(screen.getByLabelText(/duration/i)).toHaveValue(60);
      expect(screen.getByLabelText(/service area/i)).toHaveValue(
        "Within 10 km",
      );
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        "Bath, trim and nail clip.",
      );
      expect(document.title).toBe("Edit Service - Pawdigree");
    });

    it("shows the existing photos with the first marked primary", async () => {
      await renderLoaded();

      expect(screen.getByText("Primary")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Remove photo 2" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/2 photos/)).toBeInTheDocument();
    });

    it("shows a not-found state when the service does not exist", async () => {
      mockApi({ get: () => json({ detail: "Not found." }, 404) });
      renderPage();

      expect(
        await screen.findByText("Service unavailable"),
      ).toBeInTheDocument();
      expect(screen.getByText("Service not found.")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Go to dashboard" }),
      ).toBeInTheDocument();
    });

    it("tells an expired session to log in again", async () => {
      mockApi({ get: () => json({}, 401) });
      renderPage();

      expect(
        await screen.findByText(
          "Your session has expired. Please log in again.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("saving", () => {
    it("submits for review with a PATCH to the service", async () => {
      await renderLoaded();

      fireEvent.change(screen.getByLabelText(/service name/i), {
        target: { value: "Deluxe grooming" },
      });
      fireEvent.change(screen.getByLabelText(/price \(ugx\)/i), {
        target: { value: "45000" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for review" }),
      );

      await waitFor(() => expect(callsWithMethod("PATCH")).toHaveLength(1));
      const [url, init] = callsWithMethod("PATCH")[0];
      const body = init?.body as FormData;

      expect(url).toBe(SERVICE_URL);
      expect(body.get("name")).toBe("Deluxe grooming");
      expect(body.get("price")).toBe("45000");
      expect(body.get("duration")).toBe("60");
      expect(body.get("category")).toBe("GROOMING");
      expect(body.get("price_type")).toBe("FIXED");
      expect(body.get("service_area")).toBe("Within 10 km");
      expect(body.get("status")).toBe("PENDING");

      expect(
        await screen.findByText(/held for review before going live/i, {
          selector: "p",
        }),
      ).toBeInTheDocument();
    });

    it("goes back to the dashboard after a successful save", async () => {
      await renderLoaded();
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for review" }),
      );

      expect(
        await screen.findByText("Dashboard page", {}, { timeout: 3000 }),
      ).toBeInTheDocument();
    });

    it("saves a draft with status DRAFT", async () => {
      await renderLoaded();
      fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

      await waitFor(() => expect(callsWithMethod("PATCH")).toHaveLength(1));
      const body = callsWithMethod("PATCH")[0][1]?.body as FormData;
      expect(body.get("status")).toBe("DRAFT");
      expect(await screen.findByText("Draft saved.")).toBeInTheDocument();
    });

    it("lets a draft be saved without a description", async () => {
      await renderLoaded();
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

      await waitFor(() => expect(callsWithMethod("PATCH")).toHaveLength(1));
    });

    it("refuses to save a draft without a service name", async () => {
      await renderLoaded();
      fireEvent.change(screen.getByLabelText(/service name/i), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

      expect(
        await screen.findByText("Add a service name before saving."),
      ).toBeInTheDocument();
      expect(callsWithMethod("PATCH")).toHaveLength(0);
    });

    it("shows the server's validation message when saving fails", async () => {
      mockApi({ patch: () => json({ name: ["Name is too long."] }, 400) });
      await renderLoaded();
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for review" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "name: Name is too long.",
      );
      // The form stays usable so the vendor can fix it and retry.
      expect(
        screen.getByRole("button", { name: "Submit for review" }),
      ).toBeEnabled();
    });

    it("sends the ids of removed photos", async () => {
      await renderLoaded();
      fireEvent.click(screen.getByRole("button", { name: "Remove photo 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Save as draft" }));

      await waitFor(() => expect(callsWithMethod("PATCH")).toHaveLength(1));
      const body = callsWithMethod("PATCH")[0][1]?.body as FormData;
      expect(body.getAll("remove_image_ids")).toEqual(["3"]);
    });
  });

  describe("removing the service", () => {
    function openDialog() {
      fireEvent.click(screen.getByRole("button", { name: "Remove service" }));
      return screen.getByRole("alertdialog");
    }

    it("asks for confirmation before deleting anything", async () => {
      await renderLoaded();
      const dialog = openDialog();

      expect(
        within(dialog).getByText("Remove this service?"),
      ).toBeInTheDocument();
      expect(within(dialog).getByText("Full grooming")).toBeInTheDocument();
      expect(callsWithMethod("DELETE")).toHaveLength(0);
    });

    it("keeps the service when the vendor cancels", async () => {
      await renderLoaded();
      const dialog = openDialog();
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Keep service" }),
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(callsWithMethod("DELETE")).toHaveLength(0);
    });

    it("closes with the Escape key", async () => {
      await renderLoaded();
      openDialog();
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(callsWithMethod("DELETE")).toHaveLength(0);
    });

    it("deletes the service and returns to the dashboard on confirm", async () => {
      await renderLoaded();
      const dialog = openDialog();
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Remove service" }),
      );

      expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
      expect(callsWithMethod("DELETE")).toHaveLength(1);
      expect(callsWithMethod("DELETE")[0][0]).toBe(SERVICE_URL);
    });

    it("keeps the dialog open and explains when deleting fails", async () => {
      mockApi({ del: () => new Response(null, { status: 500 }) });
      await renderLoaded();
      const dialog = openDialog();
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Remove service" }),
      );

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        "Request failed (500).",
      );
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Remove service" }),
      ).toBeEnabled();
    });
  });
});

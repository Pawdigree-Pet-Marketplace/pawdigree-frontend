import {
  cleanup,
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VendorAddServicePage from "../pages/Vendor/VendorAddServicePage";
import { getCategories, type Category } from "../services/categoryService";
import { vendorAuthenticatedFetch } from "../services/vendorAuthenticatedFetch";

vi.mock("../layouts/VendorLayout/VendorLayout", () => ({
  default: ({
    children,
    title,
    description,
  }: {
    children: ReactNode;
    title: string;
    description: string;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  ),
}));
vi.mock("../services/api", () => ({ default: "https://api.test" }));
vi.mock("../services/categoryService", () => ({
  getCategories: vi.fn(),
  categoryKindForBusinessType: (type?: string | null) =>
    ({
      PET_SALE_ADOPTION: "pets",
      PRODUCT_SELLER: "merchandise",
      SERVICE_PROVIDER: "services",
    })[type ?? ""] ?? null,
}));
vi.mock("../services/vendorAuthenticatedFetch", () => ({
  vendorAuthenticatedFetch: vi.fn(),
}));

const businesses = [
  { id: "business-123", name: "Happy Paws", business_type: "SERVICE_PROVIDER" },
  { id: "business-456", name: "Paw Supplies", business_type: "PRODUCT_SELLER" },
];
const categories: Category[] = [
  {
    id: 4,
    name: "Grooming",
    slug: "grooming",
    kind: "services",
    is_active: true,
  },
  {
    id: 7,
    name: "Boarding",
    slug: "boarding",
    kind: "services",
    is_active: true,
  },
];
const merchandiseCategories: Category[] = [
  {
    id: 9,
    name: "Leashes",
    slug: "leashes",
    kind: "merchandise",
    is_active: true,
  },
];
const response = (data: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }) as Response;
const render = (ui: React.ReactNode) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe("VendorAddServicePage", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-vendor-token");
    localStorage.setItem("role", "VENDOR");
    vi.mocked(getCategories).mockResolvedValue(categories);
    vi.mocked(vendorAuthenticatedFetch).mockImplementation(async (input) => {
      if (String(input).endsWith("/api/businesses/"))
        return response(businesses);
      return response({ category_status: "approved" }, 201);
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("loads businesses and service categories for the form", async () => {
    render(<VendorAddServicePage />);
    expect(
      await screen.findByRole("option", { name: "Happy Paws" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: "Grooming" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /service name/i }),
    ).toBeRequired();
    expect(
      screen.getByRole("textbox", { name: /description/i }),
    ).toBeRequired();
    expect(
      screen.getByRole("spinbutton", { name: /price \(ugx\)/i }),
    ).toBeRequired();
    expect(
      screen.getByRole("spinbutton", { name: /duration \(minutes\)/i }),
    ).toBeRequired();
    expect(screen.getByRole("button", { name: /save service/i })).toBeEnabled();
  });

  it("reloads available categories when the selected business changes type", async () => {
    const user = userEvent.setup();
    vi.mocked(getCategories).mockImplementation(async (kind) =>
      kind === "merchandise" ? merchandiseCategories : categories,
    );
    render(<VendorAddServicePage />);

    await screen.findByRole("option", { name: "Grooming" });
    await user.selectOptions(
      screen.getByLabelText(/your business/i),
      "business-456",
    );

    expect(
      await screen.findByRole("option", { name: "Leashes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Grooming" }),
    ).not.toBeInTheDocument();
    expect(getCategories).toHaveBeenCalledWith("services");
    expect(getCategories).toHaveBeenCalledWith("merchandise");
  });

  it("validates required fields and duration before sending", async () => {
    const user = userEvent.setup();
    render(<VendorAddServicePage />);
    const saveButton = await screen.findByRole("button", {
      name: /save service/i,
    });
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    expect(form).not.toBeValid();
    await user.type(
      screen.getByRole("textbox", { name: /service name/i }),
      "Dog grooming",
    );
    await user.type(
      screen.getByRole("textbox", { name: /description/i }),
      "Bath, brush and nail trim.",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: /price \(ugx\)/i }),
      "50000",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: /duration \(minutes\)/i }),
      "60",
    );
    expect(form).toBeValid();
    const duration = screen.getByRole("spinbutton", {
      name: /duration \(minutes\)/i,
    });
    await user.clear(duration);
    await user.type(duration, "0");
    expect(duration).toBeInvalid();
    expect(saveButton).toBeEnabled();
  });

  it("posts the selected business and category to the service API", async () => {
    const user = userEvent.setup();
    render(<VendorAddServicePage />);
    await screen.findByRole("option", { name: "Grooming" });
    await user.type(
      screen.getByRole("textbox", { name: /service name/i }),
      "Full dog grooming",
    );
    await user.type(
      screen.getByRole("textbox", { name: /description/i }),
      "Bathing and grooming for dogs.",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: /price \(ugx\)/i }),
      "50000",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: /duration \(minutes\)/i }),
      "60",
    );
    await user.click(screen.getByRole("button", { name: /save service/i }));
    await waitFor(() =>
      expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(
        "https://api.test/api/services/",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const [, request] = vi.mocked(vendorAuthenticatedFetch).mock.calls.at(-1)!;
    expect(JSON.parse(String(request?.body))).toEqual({
      business: "business-123",
      category: 4,
      name: "Full dog grooming",
      service_type: "Grooming",
      description: "Bathing and grooming for dogs.",
      price: "50000",
      duration: 60,
      availability_status: "available",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("awaiting review");
  });

  it("previews an optional image and sends it as the singular multipart image field", async () => {
    const user = userEvent.setup();
    render(<VendorAddServicePage />);
    await screen.findByRole("option", { name: "Grooming" });
    await user.type(screen.getByRole("textbox", { name: /service name/i }), "Full dog grooming");
    await user.type(screen.getByRole("textbox", { name: /description/i }), "Bathing and grooming for dogs.");
    await user.type(screen.getByRole("spinbutton", { name: /price \(ugx\)/i }), "50000");
    await user.type(screen.getByRole("spinbutton", { name: /duration \(minutes\)/i }), "60");
    const image = new File(["image-bytes"], "grooming.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("Choose service image"), { target: { files: [image] } });
    expect(await screen.findByRole("img", { name: /preview of grooming.webp/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /save service/i }));
    await waitFor(() => expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(expect.stringContaining("/api/services/"), expect.objectContaining({ method: "POST" })));
    const [, request] = vi.mocked(vendorAuthenticatedFetch).mock.calls.at(-1)!;
    expect(request?.body).toBeInstanceOf(FormData);
    expect((request?.body as FormData).get("image")).toBe(image);
    expect((request?.body as FormData).getAll("images")).toHaveLength(0);
    expect(request?.headers).toBeUndefined();
  });

  it("rejects invalid image types without submitting", async () => {
    render(<VendorAddServicePage />);
    await screen.findByRole("option", { name: "Grooming" });
    const file = new File(["text"], "notes.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Choose service image"), { target: { files: [file] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a JPEG, PNG or WebP image.");
    expect(screen.queryByRole("img", { name: /preview/i })).not.toBeInTheDocument();
  });

  it("shows API validation errors when the service cannot be saved", async () => {
    const user = userEvent.setup();
    vi.mocked(vendorAuthenticatedFetch).mockImplementation(async (input) => {
      if (String(input).endsWith("/api/businesses/"))
        return response(businesses);
      return response({ detail: "Service could not be saved." }, 400);
    });
    render(<VendorAddServicePage />);
    await screen.findByRole("option", { name: "Grooming" });
    await user.type(
      screen.getByRole("textbox", { name: /service name/i }),
      "Full dog grooming",
    );
    await user.type(
      screen.getByRole("textbox", { name: /description/i }),
      "Bathing and grooming for dogs.",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: /price \(ugx\)/i }),
      "50000",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: /duration \(minutes\)/i }),
      "60",
    );
    await user.click(screen.getByRole("button", { name: /save service/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "detail: Service could not be saved.",
    );
  });

  it("caps service creation input at 300 words", async () => {
    render(<VendorAddServicePage />);
    await screen.findByRole("option", { name: "Grooming" });
    const description = screen.getByRole("textbox", { name: /description/i });
    fireEvent.change(description, {
      target: { value: Array(301).fill("word").join(" ") },
    });
    expect(screen.getByText(/300 \/ 300 words/)).toBeInTheDocument();
    expect(description).toHaveValue(Array(300).fill("word").join(" "));
    expect(
      screen.getByText("Description is limited to 300 words."),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /service name/i }), {
      target: { value: "Full dog grooming" },
    });
    fireEvent.change(
      screen.getByRole("spinbutton", { name: /price \(ugx\)/i }),
      { target: { value: "50000" } },
    );
    fireEvent.change(
      screen.getByRole("spinbutton", { name: /duration \(minutes\)/i }),
      { target: { value: "60" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /save service/i }));
    await waitFor(() =>
      expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/services/"),
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("shows backend description errors beneath the service description field", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockImplementation(async (input) => {
      if (String(input).endsWith("/api/businesses/"))
        return response(businesses);
      return response(
        {
          description: [
            "Description must be 300 words or fewer (you wrote 312).",
          ],
        },
        400,
      );
    });
    render(<VendorAddServicePage />);
    await screen.findByRole("option", { name: "Happy Paws" });
    fireEvent.change(screen.getByRole("textbox", { name: /service name/i }), {
      target: { value: "Full dog grooming" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /description/i }), {
      target: { value: "Bathing and grooming for dogs." },
    });
    fireEvent.change(
      screen.getByRole("spinbutton", { name: /price \(ugx\)/i }),
      { target: { value: "50000" } },
    );
    fireEvent.change(
      screen.getByRole("spinbutton", { name: /duration \(minutes\)/i }),
      { target: { value: "60" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /save service/i }));
    expect(
      await screen.findByText(
        "Description must be 300 words or fewer (you wrote 312).",
        { selector: '[role="alert"]' },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /description/i }),
    ).toHaveAttribute("aria-invalid", "true");
  });
});

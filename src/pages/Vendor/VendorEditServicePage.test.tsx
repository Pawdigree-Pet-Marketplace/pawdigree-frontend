import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorEditServicePage from "./VendorEditServicePage";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";

vi.mock("../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch: vi.fn() }));
vi.mock("../../services/vendorBusinessStore", () => ({ useVendorBusiness: () => null, useVendorBusinesses: () => ({ businesses: [{ id: "business-123", name: "Happy Paws", business_type: "SERVICE_PROVIDER" }] }) }));
vi.mock("../../services/categoryService", () => ({ categoryKindForBusinessType: () => "services", getCategories: vi.fn().mockResolvedValue([{ id: 4, name: "Grooming", slug: "grooming", kind: "services", is_active: true }]) }));
vi.mock("../../layouts/VendorLayout/VendorLayout", () => ({ default: ({ title, children }: { title: string; children: ReactNode }) => <div><h1>{title}</h1>{children}</div> }));
vi.mock("../../components/BackButton/BackButton", () => ({ default: ({ label }: { label: string }) => <a href="/back">{label}</a> }));

const service = {
  service_id: 7, name: "Full grooming", service_type: "Grooming", description: "Bath, trim and nail clip.",
  category: 4, price: "35000", duration: 60, availability_status: "available", image: "http://img.test/grooming.jpg",
  business: "business-123", approved: false, rejection_reason: "",
};
const url = "http://api.test/api/services/7/";
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }
function renderPage() { return render(<MemoryRouter initialEntries={["/vendor/services/7/edit"]}><Routes><Route path="/vendor/services/:serviceId/edit" element={<VendorEditServicePage />} /><Route path="/vendor/dashboard" element={<p>Dashboard page</p>} /></Routes></MemoryRouter>); }
function patchCalls() { return vi.mocked(vendorAuthenticatedFetch).mock.calls.filter(([, init]) => init?.method === "PATCH"); }
async function loaded() { renderPage(); await screen.findByDisplayValue("Full grooming"); await waitFor(() => expect(screen.getByLabelText(/category/i)).toHaveValue("4")); }

describe("Vendor edit service page", () => {
  beforeEach(() => vi.mocked(vendorAuthenticatedFetch).mockImplementation(async (_input, init) => {
    if (init?.method === "DELETE") return new Response(null, { status: 204 });
    if (init?.method === "PATCH") return json(service);
    return json(service);
  }));
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("loads the existing service and its single image", async () => {
    await loaded();
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(url);
    expect(screen.getByLabelText(/service type/i)).toHaveValue("Grooming");
    expect(screen.getByLabelText(/price \(ugx\)/i)).toHaveValue(35000);
    expect(screen.getByLabelText(/duration/i)).toHaveValue(60);
    expect(screen.getByRole("img", { name: "Full grooming current service image" })).toHaveAttribute("src", service.image);
    expect(screen.getByLabelText(/category/i)).toHaveValue("4");
    expect(document.title).toBe("Edit Service - Pawdigree");
  });

  it("PATCHes only supported fields when retaining the current image", async () => {
    await loaded();
    fireEvent.change(screen.getByLabelText(/service name/i), { target: { value: "Deluxe grooming" } });
    fireEvent.change(screen.getByLabelText(/availability/i), { target: { value: "unavailable" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    const [, init] = patchCalls()[0];
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({ name: "Deluxe grooming", service_type: "Grooming", category: "4", description: "Bath, trim and nail clip.", price: "35000", duration: "60", availability_status: "unavailable" });
    for (const unsupported of ["images", "remove_image_ids", "price_type", "service_area", "status"]) expect(Object.keys(body)).not.toContain(unsupported);
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(await screen.findByRole("status")).toHaveTextContent("changes were saved");
  });

  it("replaces the image with multipart form data using the singular image field", async () => {
    await loaded();
    const image = new File(["image-bytes"], "new.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose replacement service image"), { target: { files: [image] } });
    expect(await screen.findByRole("img", { name: /preview of new.png/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    const [, init] = patchCalls()[0];
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("image")).toBe(image);
    expect((init?.body as FormData).getAll("images")).toHaveLength(0);
    expect((init?.body as FormData).has("remove_image_ids")).toBe(false);
    expect(init?.headers).toBeUndefined();
  });

  it("shows a 404 as unavailable", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(json({ detail: "Not found" }, 404));
    renderPage();
    expect(await screen.findByText("Service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toBeInTheDocument();
  });

  it("confirms before removing the service", async () => {
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Remove service" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Remove this service?")).toBeInTheDocument();
    expect(vi.mocked(vendorAuthenticatedFetch).mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep service" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes the remove confirmation with Escape", async () => {
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Remove service" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

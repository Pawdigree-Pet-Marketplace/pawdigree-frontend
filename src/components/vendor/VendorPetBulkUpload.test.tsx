import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VendorPetBulkUpload from "./VendorPetBulkUpload";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";

vi.mock("../../services/api", () => ({ default: "http://api.test" }));
vi.mock("../../services/vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch: vi.fn() }));
vi.mock("../../services/vendorBusinessStore", () => ({ useVendorBusiness: () => null }));

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}

function renderUpload() {
  return render(<MemoryRouter><VendorPetBulkUpload /></MemoryRouter>);
}

describe("VendorPetBulkUpload", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("posts the selected CSV as multipart file data and reports created listings", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(json({ created: 2, failed: [] }));
    renderUpload();
    const file = new File(["listing_type,name,species"], "pets.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("Choose a CSV file"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload CSV" }));

    expect(await screen.findByText("2 listings created.")).toBeInTheDocument();
    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(
      "http://api.test/api/pets/bulk-upload/",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    const request = vi.mocked(vendorAuthenticatedFetch).mock.calls[0]?.[1];
    expect((request?.body as FormData).get("file")).toBe(file);
  });

  it("shows backend row validation errors from a partial upload", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValueOnce(json({
      created: 1,
      failed: [{ row: 4, errors: { age: ["A valid whole number is required."] } }],
    }));
    renderUpload();
    const file = new File(["csv"], "pets.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("Choose a CSV file"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload CSV" }));

    const rowError = await screen.findByText(/Row 4:/);
    expect(rowError.closest("li")).toHaveTextContent("age A valid whole number is required.");
  });
});

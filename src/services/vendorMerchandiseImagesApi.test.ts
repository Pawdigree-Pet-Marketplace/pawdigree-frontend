import { afterEach, describe, expect, it, vi } from "vitest";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";
import {
  deleteMerchandiseImage,
  uploadMerchandiseImage,
} from "./merchandiseApi";

vi.mock("./api", () => ({ default: "http://api.test" }));
vi.mock("./vendorAuthenticatedFetch", () => ({
  vendorAuthenticatedFetch: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe("vendor merchandise image API", () => {
  it("uploads a photo as multipart form data using the existing product route", async () => {
    const file = new File(["image-bytes"], "leash.png", { type: "image/png" });
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 17,
          image: "https://media.test/leash.png",
          alt_text: "Dog leash",
          display_order: 0,
        }),
        { status: 201 },
      ),
    );

    await uploadMerchandiseImage(42, file, "Dog leash", 0);

    const [url, options] = vi.mocked(vendorAuthenticatedFetch).mock.calls[0];
    expect(url).toBe("http://api.test/api/products/42/images/");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toBeUndefined();
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("image")).toBe(file);
    expect((options?.body as FormData).get("alt_text")).toBe("Dog leash");
    expect((options?.body as FormData).get("display_order")).toBe("0");
  });

  it("deletes a saved photo using the existing image route", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await deleteMerchandiseImage(42, 17);

    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(
      "http://api.test/api/products/42/images/17/",
      { method: "DELETE" },
    );
  });
});

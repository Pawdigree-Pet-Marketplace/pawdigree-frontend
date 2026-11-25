import { afterEach, describe, expect, it, vi } from "vitest";
import { customerAuthenticatedFetch } from "./customerAuthenticatedFetch";
import { vendorAuthenticatedFetch } from "./vendorAuthenticatedFetch";
import { replyToAdoptionInfo, requestAdoptionInfo } from "./adoptionInfoApi";

vi.mock("./customerAuthenticatedFetch", () => ({ customerAuthenticatedFetch: vi.fn() }));
vi.mock("./vendorAuthenticatedFetch", () => ({ vendorAuthenticatedFetch: vi.fn() }));

describe("adoption information messaging API", () => {
  afterEach(() => vi.clearAllMocks());

  it("posts a vendor information request with the backend message contract", async () => {
    vi.mocked(vendorAuthenticatedFetch).mockResolvedValue(new Response(null, { status: 200 }));

    await requestAdoptionInfo("application-1", "Please share your references.");

    expect(vendorAuthenticatedFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/adoptions\/applications\/application-1\/request-info\/$/),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ message: "Please share your references." }) }),
    );
  });

  it("posts a customer reply with the backend message contract", async () => {
    vi.mocked(customerAuthenticatedFetch).mockResolvedValue(new Response(null, { status: 200 }));

    await replyToAdoptionInfo("application-1", "Here are the references.");

    expect(customerAuthenticatedFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/adoptions\/applications\/application-1\/reply\/$/),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ message: "Here are the references." }) }),
    );
  });

  it("turns common backend statuses into actionable messages", async () => {
    vi.mocked(customerAuthenticatedFetch).mockResolvedValue(new Response("{}", { status: 429 }));

    await expect(replyToAdoptionInfo("application-1", "Hello")).rejects.toThrow("Too many requests");
  });
});

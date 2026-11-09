import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditProfilePage from "./EditProfilePage";

const profile = {
  username: "ari",
  first_name: "Faith",
  last_name: "Ahaisibwe",
  email: "faith@example.com",
  phone: "+256772123456",
};
let profilePayload: typeof profile & { city?: string };

const jsonResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

function renderEditProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile/edit"]}>
      <Routes>
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile" element={<p>Profile saved</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditProfilePage location", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "customer-token");
    profilePayload = profile;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/country-codes/")) {
          return Promise.resolve(
            jsonResponse([{ country: "Uganda", iso_code: "UG", dial_code: "+256" }]),
          );
        }
        if (url.endsWith("/api/auth/profile/")) {
          return Promise.resolve(jsonResponse(profilePayload));
        }
        return Promise.resolve(jsonResponse({}));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefills and persists a customer's saved city after a successful profile save", async () => {
    localStorage.setItem(
      "pawdigree-customer-location:faith@example.com",
      "Kampala",
    );
    renderEditProfile();

    const location = await screen.findByLabelText("Location");
    expect(location).toHaveValue("Kampala");

    fireEvent.change(location, { target: { value: "Entebbe" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Profile saved")).toBeInTheDocument();
    expect(
      localStorage.getItem("pawdigree-customer-location:faith@example.com"),
    ).toBe("Entebbe");
    await waitFor(() => {
      const requests = vi.mocked(fetch).mock.calls;
      const profilePatch = requests.find(
        ([url, init]) =>
          String(url).endsWith("/api/auth/profile/") && init?.method === "PATCH",
      );
      expect(profilePatch).toBeDefined();
      expect(JSON.parse(String(profilePatch?.[1]?.body))).not.toHaveProperty(
        "location",
      );
    });
  });

  it("leaves the city input empty so its placeholder is used when there is no saved city", async () => {
    renderEditProfile();
    const location = await screen.findByLabelText("Location");

    expect(location).toHaveValue("");
    expect(location).toHaveAttribute("placeholder", "Kampala");
  });

  it("prefers a city returned by the profile API", async () => {
    profilePayload = { ...profile, city: "Wakiso" };
    localStorage.setItem(
      "pawdigree-customer-location:faith@example.com",
      "Kampala",
    );
    renderEditProfile();

    expect(await screen.findByLabelText("Location")).toHaveValue("Wakiso");
  });
});

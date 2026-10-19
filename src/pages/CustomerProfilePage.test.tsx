import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ProfilePage from "./CustomerProfilePage";

describe("ProfilePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the profile details", () => {
    render(<ProfilePage />);

    expect(
      screen.getByRole("heading", { name: "Profile", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Amina Kyomuhendo")).toBeInTheDocument();
    expect(screen.getByText("amina@email.com")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("0772 123 456")).toBeInTheDocument();
    expect(screen.getByText("Kampala")).toBeInTheDocument();
  });

  it("links Edit to the edit page and shows the account menu", () => {
    render(<ProfilePage />);

    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/profile/edit",
    );
    expect(screen.getByText("My orders")).toBeInTheDocument();
    expect(screen.getByText("Security & password")).toBeInTheDocument();
  });

  it("shows saved changes from local storage", () => {
    localStorage.setItem(
      "pawdigree-profile",
      JSON.stringify({ fullName: "Grace Nakato", location: "Entebbe" }),
    );
    render(<ProfilePage />);

    expect(screen.getByText("Grace Nakato")).toBeInTheDocument();
    expect(screen.getByText("Entebbe")).toBeInTheDocument();
  });
});

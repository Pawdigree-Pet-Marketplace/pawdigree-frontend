import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CustomerDashboardNav from "./CustomerDashboardNav";

vi.mock("../../../services/notificationsApi", () => ({
  getUnreadNotificationCount: vi.fn().mockResolvedValue({ unread: 4 }),
}));

describe("CustomerDashboardNav notifications link", () => {
  it("shows a labeled sidebar destination and unread count", async () => {
    render(<MemoryRouter initialEntries={["/customer/dashboard"]}><CustomerDashboardNav /></MemoryRouter>);
    const link = screen.getByRole("link", { name: /notifications/i });
    expect(link).toHaveAttribute("href", "/customer/notifications");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/customer/cart");
    expect(await screen.findByLabelText("4 unread")).toBeInTheDocument();
  });
});

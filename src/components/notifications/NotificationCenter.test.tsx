import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationCenter from "./NotificationCenter";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "../../services/notificationsApi";

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...await importOriginal<typeof import("react-router-dom")>(),
  useNavigate: () => navigate,
}));
vi.mock("../../services/notificationsApi", () => ({
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const notification = {
  notification_id: 12,
  type: "ADOPTION_NEW",
  message: "A new adoption application was submitted.",
  business_id: "business-42",
  business_name: "Bam Bam Homes",
  reference_type: "adoption",
  reference_id: "application-7",
  is_read: false,
  created_at: "2026-11-25T10:00:00Z",
  updated_at: "2026-11-25T10:00:00Z",
};

describe("NotificationCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUnreadNotificationCount).mockResolvedValue({ unread: 1 });
    vi.mocked(getNotifications).mockResolvedValue({ count: 1, next: null, previous: null, results: [notification] });
    vi.mocked(markNotificationRead).mockResolvedValue();
    vi.mocked(markAllNotificationsRead).mockResolvedValue({ unread: 0 });
  });

  it("loads business-scoped vendor notifications and opens the matching adoption application", async () => {
    render(<NotificationCenter role="vendor" businessId="business-42" />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    expect(await screen.findByText("A new adoption application was submitted.")).toBeInTheDocument();
    expect(getNotifications).toHaveBeenCalledWith("vendor", { businessId: "business-42" });
    expect(screen.getByText("Bam Bam Homes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/vendor/business/business-42/adoption-applications?application=application-7"));
    expect(markNotificationRead).toHaveBeenCalledWith("vendor", 12);
  });

  it("marks all customer notifications read", async () => {
    render(<NotificationCenter role="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(await screen.findByText("A new adoption application was submitted.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark all notifications as read" }));
    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalledWith("customer", undefined));
  });

  it("reports an empty state", async () => {
    vi.mocked(getNotifications).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    render(<NotificationCenter role="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(await screen.findByText("No notifications yet.")).toBeInTheDocument();
    expect(getUnreadNotificationCount).toHaveBeenCalledWith("customer", undefined);
  });

  it("renders all notifications as a page without a bell trigger", async () => {
    render(<NotificationCenter role="customer" presentation="page" />);
    expect(await screen.findByRole("heading", { level: 1, name: "Notifications" })).toBeInTheDocument();
    expect(await screen.findByText("A new adoption application was submitted.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Notifications/ })).not.toBeInTheDocument();
  });

  it("shows a recoverable error when notifications cannot be loaded", async () => {
    vi.mocked(getNotifications).mockRejectedValue(new Error("Notifications could not be loaded."));
    render(<NotificationCenter role="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Notifications could not be loaded.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

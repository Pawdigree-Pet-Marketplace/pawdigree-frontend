import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronDown, ExternalLink, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRole,
  type PawdigreeNotification,
} from "../../services/notificationsApi";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";
import "./NotificationCenter.css";

type Props = { role: NotificationRole; businessId?: string | null; compact?: boolean; presentation?: "popover" | "page"; showPageTitle?: boolean; showSectionTitle?: boolean };

const labels: Record<string, string> = {
  LISTING_APPROVED: "Listing approved", LISTING_REJECTED: "Listing update", LISTING_PENDING: "Listing pending",
  ORDER_PLACED: "Order", PAYMENT_CONFIRMED: "Payment", PAYMENT_FAILED: "Payment", NEW_ORDER: "New order",
  NEW_PET_SALE: "Pet sale", ORDER_STATUS: "Order update", ORDER_CANCELLED: "Order cancelled", ORDER_EXPIRED: "Order expired",
  REFUND_REQUIRED: "Refund", REFUND_CONFIRMED: "Refund", BOOKING_NEW: "New booking", BOOKING_UPDATED: "Booking update",
  BOOKING_CANCELLED: "Booking cancelled", BOOKING_RESCHEDULED: "Booking rescheduled", BOOKING_REMINDER: "Booking reminder",
  ADOPTION_NEW: "Adoption application", ADOPTION_REPLY: "Adoption conversation", ADOPTION_UPDATE: "Adoption update",
  BUSINESS_VERIFICATION: "Business verification", NEW_REVIEW: "New review", REVIEW_REPLY: "Review reply",
};

function notificationDestination(item: PawdigreeNotification, role: NotificationRole): string | null {
  if (!item.reference_id) return null;
  const id = encodeURIComponent(item.reference_id);
  if (role === "customer") {
    switch (item.reference_type) {
      case "adoption": return `/customer/adoption?view=requests&request=${id}`;
      case "order": return `/customer/orders/${id}`;
      case "pet": return `/pets/${id}`;
      case "product": return `/merchandise/${id}`;
      case "service": return `/services/${id}`;
      default: return null;
    }
  }

  const businessId = item.business_id ? encodeURIComponent(item.business_id) : null;
  switch (item.reference_type) {
    case "adoption":
      return businessId
        ? `${vendorBusinessPath(item.business_id!, "adoption-applications")}?application=${id}`
        : `/vendor/adoption-applications?application=${id}`;
    case "vendor_order":
    case "order":
    case "booking":
      return businessId ? vendorBusinessPath(item.business_id!, "orders") : "/vendor/orders";
    case "business":
      return vendorBusinessPath(item.business_id || item.reference_id, "profile");
    case "pet":
      return businessId ? vendorBusinessPath(item.business_id!, `listings/${id}`) : null;
    case "product":
      return businessId ? vendorBusinessPath(item.business_id!, "merchandise") : null;
    case "service":
      return businessId ? vendorBusinessPath(item.business_id!, `services/${id}/edit`) : null;
    default:
      if (businessId && ["pet", "product", "service"].includes(item.reference_type)) {
        return vendorBusinessPath(item.business_id!, "listings");
      }
      return null;
  }
}

function categoryLabel(type: string): string {
  return labels[type] ?? type.replaceAll("_", " ").toLowerCase().replace(/^./, (character) => character.toUpperCase());
}

export default function NotificationCenter({ role, businessId, compact = false, presentation = "popover", showPageTitle = true, showSectionTitle = true }: Props) {
  const navigate = useNavigate();
  const isPage = presentation === "page";
  const [open, setOpen] = useState(isPage);
  const [items, setItems] = useState<PawdigreeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const refreshUnread = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount(role, businessId);
      setUnreadCount(count.unread);
    } catch {
      // Keep the last known badge value when the network is temporarily unavailable.
    }
  }, [role, businessId]);

  const refreshList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [page] = await Promise.all([
        getNotifications(role, { businessId }),
        refreshUnread(),
      ]);
      setItems(page.results);
      setNextPage(page.next ? 2 : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId, refreshUnread, role]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refreshUnread();
      if (isPage) void refreshList();
    }, 0);
    const intervalId = window.setInterval(() => void refreshUnread(), 60_000);
    const handleFocus = () => {
      void refreshUnread();
      if (open) void refreshList();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(initialRefresh);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isPage, open, refreshList, refreshUnread]);

  async function loadMore() {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await getNotifications(role, { businessId, page: nextPage });
      setItems((current) => [...current, ...page.results]);
      setNextPage(page.next ? nextPage + 1 : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "More notifications could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function markRead(item: PawdigreeNotification) {
    if (item.is_read) return;
    try {
      await markNotificationRead(role, item.notification_id);
      setItems((current) => current.map((entry) => entry.notification_id === item.notification_id ? { ...entry, is_read: true } : entry));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This notification could not be marked as read.");
    }
  }

  async function markAllRead() {
    try {
      const result = await markAllNotificationsRead(role, businessId);
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(result.unread);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Notifications could not be marked as read.");
    }
  }

  async function openNotification(item: PawdigreeNotification) {
    await markRead(item);
    const destination = notificationDestination(item, role);
    if (destination) {
      navigate(destination);
      setOpen(false);
    }
  }

  return (
    <div className={`notification-center${compact ? " is-compact" : ""}${isPage ? " is-page" : ""}`}>
      {isPage && showPageTitle && <header className="notification-page-title"><h1>Notifications</h1><p>All your latest updates in one place.</p></header>}
      {!isPage && <button
        type="button"
        className="notification-center-trigger"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => {
          const willOpen = !open;
          setOpen(willOpen);
          if (willOpen) void refreshList();
        }}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-center-count">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        {compact && <span className="notification-center-mobile-label">Notifications</span>}
      </button>}
      {open && (
        <section className="notification-center-panel" aria-label="Notifications">
          <header className="notification-center-heading">
            <div>{showSectionTitle && <h2>Notifications</h2>}<span>{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</span></div>
            <div className="notification-center-heading-actions">
              {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} aria-label="Mark all notifications as read" title="Mark all as read"><CheckCheck size={17} /></button>}
              {!isPage && <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X size={18} /></button>}
            </div>
          </header>
          {error && <div className="notification-center-error" role="alert">{error}<button type="button" onClick={() => void refreshList()}>Try again</button></div>}
          {loading ? <p className="notification-center-state" role="status">Loading notifications…</p>
            : items.length === 0 && !error ? <p className="notification-center-state">No notifications yet.</p>
              : <ul className="notification-center-list">{items.map((item) => {
                const destination = notificationDestination(item, role);
                return <li key={item.notification_id} className={`notification-center-item${item.is_read ? " is-read" : " is-unread"}`}>
                  <span className="notification-center-category">{categoryLabel(item.type)}</span>
                  {role === "vendor" && item.business_name && <span className="notification-center-business">{item.business_name}</span>}
                  <p>{item.message}</p>
                  <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                  <div className="notification-center-item-actions">
                    {destination && <button type="button" onClick={() => void openNotification(item)}>Open <ExternalLink size={13} aria-hidden="true" /></button>}
                    {!item.is_read && <button type="button" onClick={() => void markRead(item)}>Mark read</button>}
                  </div>
                </li>;
              })}</ul>}
          {!loading && nextPage && <button className="notification-center-more" type="button" onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? "Loading…" : <>More notifications <ChevronDown size={15} /></>}</button>}
        </section>
      )}
    </div>
  );
}

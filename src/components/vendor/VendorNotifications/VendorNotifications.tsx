import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getVendorNotifications, getVendorUnreadNotificationCount, markVendorNotificationRead, type VendorNotification } from "../../../services/vendorNotificationsApi";

export default function VendorNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<VendorNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const unread = unreadCount ?? items.filter((item) => !item.is_read).length;

  useEffect(() => {
    let cancelled = false;
    getVendorUnreadNotificationCount().then((count) => { if (!cancelled) setUnreadCount(count); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([getVendorNotifications(), getVendorUnreadNotificationCount()]).then(([result, count]) => { if (!cancelled) { setItems(result); setUnreadCount(count); } })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Notifications could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  async function markRead(item: VendorNotification) {
    try {
      await markVendorNotificationRead(item.notification_id);
      setItems((current) => current.map((entry) => entry.notification_id === item.notification_id ? { ...entry, is_read: true } : entry));
      setUnreadCount((count) => count === null ? null : Math.max(0, count - 1));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This notification could not be marked as read.");
    }
  }

  function toggleOpen() {
    if (!open) { setLoading(true); setError(""); }
    setOpen((value) => !value);
  }

  return <div className="vendor-notifications">
    <button type="button" className="dashboard-notification-button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={toggleOpen}>
      <Bell size={18} aria-hidden="true" />{unread > 0 && <span className="vendor-notification-count">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && <section className="vendor-notification-panel" aria-label="Notifications">
      <div className="vendor-notification-heading"><h2>Notifications</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications">×</button></div>
      {loading ? <p role="status">Loading notifications…</p> : error ? <p role="alert">{error}</p> : items.length === 0 ? <p>No notifications yet.</p> : <ul>{items.map((item) => <li key={item.notification_id} className={item.is_read ? "is-read" : "is-unread"}>
        <p>{item.message}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
        {!item.is_read && <button type="button" onClick={() => void markRead(item)}>Mark as read</button>}
      </li>)}</ul>}
    </section>}
  </div>;
}

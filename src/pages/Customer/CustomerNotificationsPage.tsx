import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import NotificationCenter from "../../components/notifications/NotificationCenter";
import "../NotificationsPage.css";

export default function CustomerNotificationsPage() {
  return (
    <div className="customer-dashboard-layout">
      <CustomerDashboardNav />
      <main className="customer-dashboard-main customer-notifications-main">
        <NotificationCenter role="customer" presentation="page" />
      </main>
    </div>
  );
}

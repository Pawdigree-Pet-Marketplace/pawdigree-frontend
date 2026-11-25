import NotificationCenter from "../../components/notifications/NotificationCenter";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import "../NotificationsPage.css";

export default function VendorNotificationsPage() {
  return (
    <VendorLayout title="Notifications" description="Updates about your business and customers.">
      <div className="vendor-notifications-page-content">
        <NotificationCenter role="vendor" presentation="page" />
      </div>
    </VendorLayout>
  );
}

import NotificationCenter from "../../components/notifications/NotificationCenter";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import "../NotificationsPage.css";

export default function VendorNotificationsPage() {
  const business = useVendorBusiness();
  return (
    <VendorLayout title="Notifications" description="Updates about your business and customers." vendorWorkspace>
      <div className="dashboard-content vendor-catalogue vendor-notifications-page-content">
        <NotificationCenter role="vendor" businessId={business?.id ?? null} presentation="page" showPageTitle={false} showSectionTitle={false} />
      </div>
    </VendorLayout>
  );
}

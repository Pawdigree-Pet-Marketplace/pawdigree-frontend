import { useVendorBusiness } from "../../../services/vendorBusinessStore";
import NotificationCenter from "../../notifications/NotificationCenter";

export default function VendorNotifications() {
  const business = useVendorBusiness();
  return <NotificationCenter role="vendor" businessId={business?.id ?? null} />;
}

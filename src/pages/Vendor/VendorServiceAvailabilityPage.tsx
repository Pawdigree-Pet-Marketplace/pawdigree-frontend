import { Navigate, useParams } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import ServiceAvailability from "../../components/vendor/ServiceAvailability/ServiceAvailability";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";

export default function VendorServiceAvailabilityPage() {
  const { serviceId = "" } = useParams();
  const business = useVendorBusiness();

  if (business && business.business_type !== "SERVICE_PROVIDER") {
    return <Navigate to={vendorBusinessPath(String(business.id), "dashboard")} replace />;
  }

  return (
    <VendorLayout
      title="Service Availability"
      description="Manage the days and times customers can book your service."
      vendorWorkspace
    >
      <div className="vendor-page-content">
        {serviceId ? (
          <ServiceAvailability serviceId={serviceId} />
        ) : (
          <p>Service ID is missing.</p>
        )}
      </div>
    </VendorLayout>
  );
}

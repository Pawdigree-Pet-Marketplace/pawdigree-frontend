import { useParams } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import ServiceAvailability from "../../components/vendor/ServiceAvailability/ServiceAvailability";

export default function VendorServiceAvailabilityPage() {
  const { serviceId = "" } = useParams();

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
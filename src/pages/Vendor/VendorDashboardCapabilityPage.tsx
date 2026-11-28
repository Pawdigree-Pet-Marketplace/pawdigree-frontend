import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";

type Props = { title: string; description: string; children: ReactNode };

export default function VendorDashboardCapabilityPage({ title, description, children }: Props) {
  return (
    <VendorLayout title={title} description={description} businessName="Your businesses" vendorWorkspace mainVendorDashboard>
      <div className="dashboard-content">
        <section className="dashboard-panel dashboard-capability-panel">
          <p className="dashboard-activity-state">{children}</p>
          {title === "Customer Messages" && <p className="dashboard-activity-state"><Link to="/vendor/adoption-applications">Open adoption applications</Link> to continue using the existing application-specific information exchange.</p>}
        </section>
      </div>
    </VendorLayout>
  );
}

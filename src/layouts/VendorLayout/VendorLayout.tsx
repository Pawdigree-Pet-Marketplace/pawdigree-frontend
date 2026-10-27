import type { ReactNode } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar/VendorSidebar";
import VendorTopbar from "../../components/vendor/VendorTopbar/VendorTopbar";
import VendorPageHeader from "../../components/vendor/VendorPageHeader/VendorPageHeader";
import { PawPrint } from "lucide-react";
import "./VendorLayout.css";

type VendorLayoutProps = {
  children: ReactNode;
  title: string;
  description: string;
  businessName?: string;
  vendorWorkspace?: boolean;
};

export default function VendorLayout({
  children,
  title,
  description,
  businessName = "Your store",
  vendorWorkspace = false,
}: VendorLayoutProps) {
  return (
    <main className={`vendor-dashboard${vendorWorkspace ? " vendor-workspace" : ""}`}>
      <VendorSidebar />

      <section className="dashboard-main">
        <header className="dashboard-header">
          {vendorWorkspace && (
            <span className="dashboard-welcome-flyby" aria-hidden="true">
              <PawPrint className="dashboard-flying-paw dashboard-flying-paw-one" size={17} />
              <PawPrint className="dashboard-flying-paw dashboard-flying-paw-two" size={13} />
            </span>
          )}
          {vendorWorkspace && (
            <span className="dashboard-welcome-paw" aria-hidden="true">
              <PawPrint size={24} strokeWidth={1.8} />
            </span>
          )}
          <VendorPageHeader
            title={title}
            description={description}
          />

          <VendorTopbar businessName={businessName} />
        </header>

        {children}
      </section>
    </main>
  );
}


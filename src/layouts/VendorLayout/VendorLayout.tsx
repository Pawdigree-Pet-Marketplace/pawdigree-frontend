import type { ReactNode } from "react";
import VendorSidebar from "../../components/vendor/VendorSidebar/VendorSidebar";
import VendorTopbar from "../../components/vendor/VendorTopbar/VendorTopbar";
import VendorPageHeader from "../../components/vendor/VendorPageHeader/VendorPageHeader";
import "./VendorLayout.css";

type VendorLayoutProps = {
  children: ReactNode;
  title: string;
  description: string;
  businessName?: string;
};

export default function VendorLayout({
  children,
  title,
  description,
  businessName = "Your store",
}: VendorLayoutProps) {
  return (
    <main className="vendor-dashboard">
      <VendorSidebar />

      <section className="dashboard-main">
        <header className="dashboard-header">
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

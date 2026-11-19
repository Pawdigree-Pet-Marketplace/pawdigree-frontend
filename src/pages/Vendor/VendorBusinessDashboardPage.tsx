import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarCheck, DollarSign, FileText, ShoppingCart, Wallet } from "lucide-react";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { apiRequest } from "../../services/api";
import BusinessVerificationStatus from "../../components/BusinessVerificationStatus/BusinessVerificationStatus";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import "./VendorDashboardPage.css";

type Metric = {
  icon: typeof DollarSign;
  label: string;
  tone: string;
};

const productMetrics: Metric[] = [
  { icon: DollarSign, label: "Total Sales", tone: "teal" },
  { icon: ShoppingCart, label: "Orders", tone: "coral" },
  { icon: Wallet, label: "Revenue (net)", tone: "green" },
];

const petMetrics: Metric[] = [
  { icon: DollarSign, label: "Total Sales", tone: "teal" },
  { icon: ShoppingCart, label: "Pet Sales", tone: "coral" },
  { icon: FileText, label: "Adoption Applications", tone: "green" },
];

const serviceMetrics: Metric[] = [
  { icon: DollarSign, label: "Total Sales", tone: "teal" },
  { icon: BriefcaseBusiness, label: "Services", tone: "coral" },
  { icon: CalendarCheck, label: "Bookings", tone: "red" },
];

export default function VendorBusinessDashboardPage() {
  const business = useVendorBusiness();
  const [firstName, setFirstName] = useState("");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");

  useEffect(() => {
    if (!token || role !== "VENDOR") return;
    let cancelled = false;
    void apiRequest<{ first_name?: string }>("/auth/current-user/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((user) => { if (!cancelled) setFirstName(user.first_name?.trim() ?? ""); })
      .catch(() => { if (!cancelled) setFirstName(""); });
    return () => { cancelled = true; };
  }, [token, role]);

  if (!token || role !== "VENDOR" || !business) return null;

  const businessType = business.business_type;
  const metrics = businessType === "PRODUCT_SELLER"
    ? productMetrics
    : businessType === "PET_SALE_ADOPTION"
      ? petMetrics
      : businessType === "SERVICE_PROVIDER"
        ? serviceMetrics
        : productMetrics;
  const activityTitle = businessType === "PRODUCT_SELLER"
    ? "RECENT ORDERS"
    : businessType === "SERVICE_PROVIDER"
      ? "RECENT BOOKINGS"
      : null;
  const activityMessage = businessType === "PRODUCT_SELLER"
    ? "Recent order activity will appear here when it is available."
    : "Recent booking activity will appear here when it is available.";

  return (
    <VendorLayout
      title={`Welcome back, ${firstName || "there"}`}
      description="Here's how your store is doing today"
      businessName={business.name}
      showBusinessSwitcher
      vendorWorkspace
    >
      <div className="dashboard-content">
        <BusinessVerificationStatus businessId={String(business.id)} />
        <section className="dashboard-metrics" aria-label="Business metrics">
          {metrics.map((metric) => {
            const MetricIcon = metric.icon;
            return (
              <article className="dashboard-metric-card" key={metric.label}>
                <span className={`dashboard-metric-icon ${metric.tone}`} aria-hidden="true">
                  <MetricIcon size={18} strokeWidth={1.9} />
                </span>
                <strong aria-label={`${metric.label} not available`}>—</strong>
                <div className="dashboard-metric-bottom"><span>{metric.label}</span></div>
              </article>
            );
          })}
        </section>

        <section className="dashboard-analytics">
          <article className="dashboard-panel dashboard-sales-panel">
            <h2>SALES — LAST 7 DAYS</h2>
            <div className="dashboard-chart dashboard-empty-chart">
              <p className="dashboard-empty-state">Sales history will appear here when store activity is available.</p>
            </div>
          </article>
          {businessType === "PRODUCT_SELLER" && (
            <article className="dashboard-panel dashboard-stock-panel">
              <h2>LOW STOCK ALERTS</h2>
              <p className="dashboard-empty-state dashboard-stock-empty">Stock alerts will appear here when inventory data is available.</p>
            </article>
          )}
        </section>

        {activityTitle && (
          <section className="dashboard-panel dashboard-orders-panel">
            <h2>{activityTitle}</h2>
            <div className="dashboard-table-wrapper">
              <table className="dashboard-orders-table">
                <thead>
                  <tr><th>REFERENCE</th><th>CUSTOMER</th><th>TYPE</th><th>AMOUNT</th><th>STATUS</th></tr>
                </thead>
                <tbody>
                  <tr><td colSpan={5} className="dashboard-activity-empty">{activityMessage}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </VendorLayout>
  );
}

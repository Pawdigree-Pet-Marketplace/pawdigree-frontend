
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  DollarSign,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { apiRequest } from "../../services/api";
import BusinessVerificationStatus from "../../components/BusinessVerificationStatus/BusinessVerificationStatus";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import "./VendorDashboardPage.css";

const metrics = [
  { icon: DollarSign, label: "Total Sales", tone: "teal" },
  { icon: ShoppingCart, label: "Orders", tone: "coral" },
  { icon: Wallet, label: "Revenue (net)", tone: "green" },
  { icon: CalendarCheck, label: "Pending Bookings", tone: "red" },
];

function VendorDashboardPage() {
  const activeBusiness = useVendorBusiness();
  const [firstName, setFirstName] = useState("");
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const role =
    localStorage.getItem("role") ||
    sessionStorage.getItem("role");

  useEffect(() => {
    if (!token || role !== "VENDOR") return;

    let cancelled = false;

    void apiRequest<{ first_name?: string }>("/auth/current-user/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((user) => {
        if (!cancelled) setFirstName(user.first_name?.trim() ?? "");
      })
      .catch(() => {
        if (!cancelled) setFirstName("");
      });

    return () => {
      cancelled = true;
    };
  }, [token, role]);
  if (!token || role !== "VENDOR") {
    return null;
  }

  return (
    <VendorLayout
      title={`Welcome back, ${firstName || "there"}`}
      description="Here's how your store is doing today"
      businessName={activeBusiness?.name ?? "Your store"}
      showBusinessSwitcher
      vendorWorkspace
    >
      <div className="dashboard-content">
        {/* BUSINESS VERIFICATION STATUS */}
        <BusinessVerificationStatus businessId={activeBusiness ? String(activeBusiness.id) : undefined} />
        {/* METRIC CARDS */}
        <section
          className="dashboard-metrics"
          aria-label="Store metrics"
        >
          {metrics.map((metric) => {
            const MetricIcon = metric.icon;

            return (
              <article
                className="dashboard-metric-card"
                key={metric.label}
              >
                <span
                  className={`dashboard-metric-icon ${metric.tone}`}
                  aria-hidden="true"
                >
                  <MetricIcon size={18} strokeWidth={1.9} />
                </span>

                <strong aria-label={`${metric.label} not available`}>—</strong>

                <div className="dashboard-metric-bottom">
                  <span>{metric.label}</span>

                </div>
              </article>
            );
          })}
        </section>

        {/* SALES CHART AND STOCK ALERTS */}
        <section className="dashboard-analytics">
          <article className="dashboard-panel dashboard-sales-panel">
            <h2>SALES — LAST 7 DAYS</h2>

            <div className="dashboard-chart dashboard-empty-chart">
              <p className="dashboard-empty-state">Sales history will appear here when store activity is available.</p>
            </div>
          </article>

          <article className="dashboard-panel dashboard-stock-panel">
            <h2>LOW STOCK ALERTS</h2>

            <p className="dashboard-empty-state dashboard-stock-empty">Stock alerts will appear here when inventory data is available.</p>
          </article>
        </section>

        {/* RECENT ORDERS */}
        <section className="dashboard-panel dashboard-orders-panel">
          <h2>RECENT ORDERS & BOOKINGS</h2>

          <div className="dashboard-table-wrapper">
            <table className="dashboard-orders-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>TYPE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td colSpan={5} className="dashboard-activity-empty">
                    Recent order and booking activity will appear here when it is available.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </VendorLayout>
  );
}

export default VendorDashboardPage;



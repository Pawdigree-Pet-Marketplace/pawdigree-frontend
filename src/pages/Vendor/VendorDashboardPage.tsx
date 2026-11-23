
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  DollarSign,
  ExternalLink,
  Package,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { apiRequest } from "../../services/api";
import { useVendorBusinesses, useVendorBusiness } from "../../services/vendorBusinessStore";
import VendorDashboardTour from "../../components/vendor/VendorDashboardTour/VendorDashboardTour";
import { VendorBusinessList } from "../../components/vendor/VendorBusinessSwitcher/VendorBusinessSwitcher";
import { getMerchandise, type Merchandise } from "../../services/merchandiseApi";
import "./VendorDashboardPage.css";

const metrics = [
  { icon: DollarSign, label: "Total Sales", tone: "teal" },
  { icon: ShoppingCart, label: "Orders", tone: "coral" },
  { icon: Wallet, label: "Revenue (net)", tone: "green" },
  { icon: CalendarCheck, label: "Pending Bookings", tone: "red" },
];

function VendorDashboardPage() {
  const activeBusiness = useVendorBusiness();
  const { businesses, loading: businessesLoading, error: businessesError } = useVendorBusinesses();
  const [firstName, setFirstName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [merchandiseLoading, setMerchandiseLoading] = useState(true);
  const [merchandiseLoadError, setMerchandiseLoadError] = useState(false);
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const role =
    localStorage.getItem("role") ||
    sessionStorage.getItem("role");
  const eligibleBusinessIds = new Set(businesses.filter((business) => business.business_type === "PRODUCT_SELLER").map((business) => String(business.id)));
  const eligibleMerchandise = merchandise.filter((product) => eligibleBusinessIds.has(String(product.business)));

  useEffect(() => {
    if (!token || role !== "VENDOR") return;

    let cancelled = false;

    void apiRequest<{ first_name?: string; id?: string | number }>("/auth/current-user/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((user) => {
        if (!cancelled) {
          setFirstName(user.first_name?.trim() ?? "");
          setVendorId(user.id === undefined ? "" : String(user.id));
        }
      })
      .catch(() => {
        if (!cancelled) setFirstName("");
      });

    return () => {
      cancelled = true;
    };
  }, [token, role]);

  useEffect(() => {
    if (!token || role !== "VENDOR") return;
    let cancelled = false;
    void getMerchandise()
      .then((products) => {
        if (!cancelled) {
          setMerchandise(products);
          setMerchandiseLoadError(false);
          setMerchandiseLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMerchandiseLoadError(true);
          setMerchandiseLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [token, role]);
  if (!token || role !== "VENDOR") {
    return null;
  }

  return (
    <VendorLayout
      title={`Welcome back, ${firstName || "there"}`}
      description="Here's how your store is doing today"
      businessName={activeBusiness?.name ?? "Your store"}
      vendorWorkspace
    >
      <div className="dashboard-content">
        <VendorBusinessList businesses={businesses} loading={businessesLoading} error={businessesError} />
        {/* METRIC CARDS */}
        <section
          className="dashboard-metrics"
          aria-label="Store metrics"
          data-vendor-tour="overview"
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

        <section className="dashboard-panel dashboard-merchandise-panel" aria-labelledby="dashboard-merchandise-title" data-vendor-tour="merchandise">
          <div className="dashboard-merchandise-heading">
            <div>
              <span className="dashboard-metric-icon" aria-hidden="true"><Package size={18} strokeWidth={1.9} /></span>
              <h2 id="dashboard-merchandise-title">MERCHANDISE · VENDOR-WIDE</h2>
            </div>
            <Link className="dashboard-merchandise-link" to="/vendor/merchandise">
              Manage Merchandise <ExternalLink size={15} aria-hidden="true" />
            </Link>
          </div>
          {merchandiseLoading || businessesLoading ? (
            <p className="dashboard-merchandise-message" role="status">Loading merchandise totals…</p>
          ) : merchandiseLoadError || businessesError ? (
            <p className="dashboard-merchandise-message" role="status">Merchandise totals could not be loaded.</p>
          ) : (
            <div className="dashboard-merchandise-stats" aria-label="Merchandise totals">
              <div><strong>{eligibleMerchandise.length}</strong><span>Total products</span></div>
              <div><strong>{eligibleMerchandise.filter((product) => product.is_active).length}</strong><span>Active</span></div>
              <div><strong>{eligibleMerchandise.filter((product) => !product.is_active).length}</strong><span>Inactive</span></div>
              <div><strong>{eligibleMerchandise.filter((product) => !product.approved && !product.rejection_reason).length}</strong><span>Awaiting approval</span></div>
            </div>
          )}
        </section>

        {/* SALES CHART AND STOCK ALERTS */}
        <section className="dashboard-analytics">
          <article className="dashboard-panel dashboard-sales-panel" data-vendor-tour="sales">
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
      <VendorDashboardTour vendorId={vendorId} businessTypes={businesses.map((business) => business.business_type ?? "")} />
    </VendorLayout>
  );
}

export default VendorDashboardPage;



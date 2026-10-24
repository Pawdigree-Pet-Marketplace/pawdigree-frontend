import CustomerDashboardNav from "../../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import CustomerDashboard from "./CustomerDashboard";

export default function CustomerDashboardLayout() {
  return (
    <div className="customer-dashboard-layout">
      <CustomerDashboardNav />
      <div className="customer-dashboard-main">
        <CustomerDashboard />
      </div>
    </div>
  );
}

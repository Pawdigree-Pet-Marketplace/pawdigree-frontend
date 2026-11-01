import { Outlet } from "react-router-dom";
import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import "./CustomerShell.css";

export default function CustomerShell() {
  return (
    <div className="customer-dashboard-layout">
      <CustomerDashboardNav />
      <div className="customer-dashboard-main customer-shell-content">
        <Outlet />
      </div>
    </div>
  );
}

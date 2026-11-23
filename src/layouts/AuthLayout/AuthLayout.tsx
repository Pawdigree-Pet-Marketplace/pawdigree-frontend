import { Link, Outlet } from "react-router-dom";
import darkLogo from "../../assets/logos/darkmode-logo.svg";
import "./AuthLayout.css";

export default function AuthLayout() {
  return (
    <>
      <div className="auth-layout-glow" aria-hidden="true" />
      <Link to="/" className="auth-layout-logo" aria-label="Pawdigree home">
        <img src={darkLogo} alt="Pawdigree" />
      </Link>
      <Outlet />
    </>
  );
}

import { Link, Outlet } from "react-router-dom";
import lightLogo from "../../assets/logos/lightmode-logo.svg";
import "./AuthLayout.css";

export default function AuthLayout() {
  return (
    <>
      <Link to="/" className="auth-layout-logo" aria-label="Pawdigree home">
        <img src={lightLogo} alt="Pawdigree" />
      </Link>
      <Outlet />
    </>
  );
}

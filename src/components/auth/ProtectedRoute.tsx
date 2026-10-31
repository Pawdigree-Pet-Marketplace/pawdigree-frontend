import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "../../services/auth/authStorage";
import { getSessionRole, getSessionToken } from "../../services/auth/authStorage";

type ProtectedRouteProps = {
  role: UserRole;
  children: ReactNode;
};

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = getSessionToken();
  const currentRole = getSessionRole();

  if (!token || !currentRole) {
    return <Navigate to={role === "VENDOR" ? "/vendor/login" : "/login"} replace state={{ from: location }} />;
  }

  if (currentRole !== role) {
    return <Navigate to={currentRole === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard"} replace />;
  }

  return children;
}

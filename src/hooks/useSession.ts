import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AUTH_SESSION_CHANGE_EVENT, getSessionRole, getSessionToken } from "../services/auth/authStorage";

export type Role = "CUSTOMER" | "VENDOR";

function readSession(role: Role): boolean {
  return Boolean(getSessionToken() && getSessionRole() === role);
}

export default function useSession(role: Role) {
  const { pathname } = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => readSession(role));

  useEffect(() => {
    const check = () => setIsLoggedIn(readSession(role));
    check();
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, check);
    };
  }, [role, pathname]);

  return isLoggedIn;
}

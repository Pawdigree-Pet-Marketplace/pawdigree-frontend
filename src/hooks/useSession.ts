import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export type Role = "CUSTOMER" | "VENDOR";

function readSession(role: Role) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const storedRole = localStorage.getItem("role") || sessionStorage.getItem("role");
  return Boolean(token && storedRole === role);
}

export default function useSession(role: Role) {
  const { pathname } = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => readSession(role));

  useEffect(() => {
    const check = () => setIsLoggedIn(readSession(role));
    check();
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, [role, pathname]);

  return isLoggedIn;
}
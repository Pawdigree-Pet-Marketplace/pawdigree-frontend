export type UserRole = "CUSTOMER" | "VENDOR";

export type AuthSession = {
  access: string;
  refresh: string;
  role: UserRole;
};

const authKeys = ["token", "access", "access_token", "refresh", "role"] as const;
export const AUTH_SESSION_CHANGE_EVENT = "auth-session-change";

function notifyAuthSessionChange(): void {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

function removeAuthSession(): void {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of authKeys) storage.removeItem(key);
  }
}

export function getAuthStorage(): Storage | null {
  for (const storage of [localStorage, sessionStorage]) {
    if (getAccessToken(storage) && storage.getItem("refresh")) return storage;
  }
  if (getAccessToken(localStorage)) return localStorage;
  if (getAccessToken(sessionStorage)) return sessionStorage;
  return null;
}

export function getAccessToken(storage: Storage): string | null {
  return storage.getItem("token") ?? storage.getItem("access") ?? storage.getItem("access_token");
}

export function getSessionRole(): UserRole | null {
  const storage = getAuthStorage();
  const role = storage?.getItem("role");
  return role === "CUSTOMER" || role === "VENDOR" ? role : null;
}

export function getSessionToken(): string | null {
  const storage = getAuthStorage();
  return storage ? getAccessToken(storage) : null;
}

export function saveAuthSession(session: AuthSession): void {
  removeAuthSession();
  localStorage.setItem("token", session.access);
  localStorage.setItem("access", session.access);
  localStorage.setItem("access_token", session.access);
  localStorage.setItem("refresh", session.refresh);
  localStorage.setItem("role", session.role);
  notifyAuthSessionChange();
}

export function clearAuthSession(): void {
  removeAuthSession();
  notifyAuthSessionChange();
}

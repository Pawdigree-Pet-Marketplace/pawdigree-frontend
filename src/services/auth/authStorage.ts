export type UserRole = "CUSTOMER" | "VENDOR";

export type AuthSession = {
  access: string;
  refresh: string;
  role: UserRole;
};

const authKeys = ["token", "access", "access_token", "refresh", "role"] as const;

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

export function saveAuthSession(session: AuthSession, remember: boolean): void {
  clearAuthSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("token", session.access);
  storage.setItem("access", session.access);
  storage.setItem("access_token", session.access);
  storage.setItem("refresh", session.refresh);
  storage.setItem("role", session.role);
}

export function clearAuthSession(): void {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of authKeys) storage.removeItem(key);
  }
}

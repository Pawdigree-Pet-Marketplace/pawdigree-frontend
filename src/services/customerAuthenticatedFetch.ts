import API_BASE_URL from "./api";
import { clearAuthSession, getAccessToken, getAuthStorage } from "./auth/authStorage";

type TokenResponse = {
  access?: string;
  refresh?: string;
};

const refreshesInFlight = new WeakMap<Storage, Promise<string | null>>();

function withAccessToken(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...init, headers };
}

function resolveRequestInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === "string" && input.startsWith("/") && API_BASE_URL) {
    return new URL(input, API_BASE_URL);
  }

  return input;
}

function refreshAccessToken(storage: Storage): Promise<string | null> {
  const currentRefresh = refreshesInFlight.get(storage);
  if (currentRefresh) return currentRefresh;

  const refreshPromise = (async () => {
    const refresh = storage.getItem("refresh");
    if (!refresh) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) return null;

      const tokens = (await response.json()) as TokenResponse;
      if (!tokens.access) return null;

      storage.setItem("token", tokens.access);
      storage.setItem("access", tokens.access);
      storage.setItem("access_token", tokens.access);
      if (tokens.refresh) storage.setItem("refresh", tokens.refresh);
      return tokens.access;
    } catch {
      return null;
    }
  })();

  refreshesInFlight.set(storage, refreshPromise);
  void refreshPromise.finally(() => refreshesInFlight.delete(storage));
  return refreshPromise;
}

/** Makes a customer API request and retries once after refreshing an expired JWT. */
export async function customerAuthenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const storage = getAuthStorage();
  const token = storage ? getAccessToken(storage) : null;
  const requestInput = resolveRequestInput(input);
  const firstResponse = await fetch(
    requestInput,
    token ? withAccessToken(init, token) : init,
  );

  if (firstResponse.status !== 401 || !storage) return firstResponse;

  const refreshedToken = await refreshAccessToken(storage);
  if (!refreshedToken) {
    clearAuthSession();
    return firstResponse;
  }

  const retryResponse = await fetch(requestInput, withAccessToken(init, refreshedToken));
  if (retryResponse.status === 401) clearAuthSession();
  return retryResponse;
}

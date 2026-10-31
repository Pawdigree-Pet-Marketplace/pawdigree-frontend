import API_BASE_URL from "./api";
import { getAccessToken, getAuthStorage } from "./auth/authStorage";

type TokenResponse = {
  access?: string;
  refresh?: string;
};

let refreshInFlight: Promise<string | null> | null = null;

function withAccessToken(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...init, headers };
}

function refreshAccessToken(storage: Storage): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
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
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Makes a vendor API request and retries once after refreshing an expired JWT. */
export async function vendorAuthenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const storage = getAuthStorage();
  const token = storage ? getAccessToken(storage) : null;
  const firstResponse = await fetch(
    input,
    token ? withAccessToken(init, token) : init,
  );

  if (firstResponse.status !== 401 || !storage) return firstResponse;

  const refreshedToken = await refreshAccessToken(storage);
  if (!refreshedToken) return firstResponse;

  return fetch(input, withAccessToken(init, refreshedToken));
}

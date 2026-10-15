type ApiErrorData = Record<string, string[] | string>;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL 

if (!API_BASE_URL && import.meta.env.MODE !== "test") {
  throw new Error(
    "VITE_API_BASE_URL is missing. Check your frontend .env file.",
  );
}


export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = data as ApiErrorData | null;

    const message = errors
      ? Object.entries(errors)
          .map(([field, messages]) => {
            const readableMessages = Array.isArray(messages)
              ? messages.join(" ")
              : messages;

            return `${field}: ${readableMessages}`;
          })
          .join("\n")
      : `Request failed with status ${response.status}.`;

    throw new Error(message || "Something went wrong.");
  }

  return data as T;
}

export default API_BASE_URL;

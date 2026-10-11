
const API_BASE_URL = 'http://127.0.0.1:8000/api';

type ApiErrorData = Record<string, string[] | string>;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = data as ApiErrorData | null;

    const message = errors
      ? Object.entries(errors)
          .map(([field, messages]) => {
            const readableMessages = Array.isArray(messages)
              ? messages.join(' ')
              : messages;

            return `${field}: ${readableMessages}`;
          })
          .join('\n')
      : `Request failed with status ${response.status}.`;

    throw new Error(message || 'Something went wrong.');
  }

  return data as T;
}

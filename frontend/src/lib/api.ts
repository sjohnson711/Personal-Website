/// <reference types="vite/client" />

export const API_BASE = (import.meta.env as any).VITE_API_URL || "/api";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiCall(
  path: string,
  options: FetchOptions = {}
): Promise<any> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "PersonalWebsite",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(new Error(error.error || error.message || `API error: ${response.status}`), {
      status: response.status,
    });
  }

  return response.json().catch(() => null);
}

export const api = {
  get: (path: string) => apiCall(path, { method: "GET" }),
  post: (path: string, body?: any) =>
    apiCall(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body?: any) =>
    apiCall(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiCall(path, { method: "DELETE" }),
};

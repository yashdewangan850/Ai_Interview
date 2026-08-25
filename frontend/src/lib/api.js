const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://ai-interview-5akr.onrender.com/api";
let authToken = "";
let unauthorizedHandler = null;

export function setAuthToken(token) {
  authToken = token || "";
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler(data.message || "Your session has expired.");
    }

    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export { API_BASE_URL };

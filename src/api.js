const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

export function getAuthToken() {
  return sessionStorage.getItem('tdt_access_token');
}

export function setAuthToken(token) {
  sessionStorage.setItem('tdt_access_token', token);
}

export function clearAuthToken() {
  sessionStorage.removeItem('tdt_access_token');
}

export async function api(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.details?.join(', ');
    const error = new Error(detail || payload.error || `Erreur HTTP ${response.status}`);
    error.status = response.status;
    if (response.status === 401 && token) {
      clearAuthToken();
      window.dispatchEvent(new Event('tdt:unauthorized'));
    }
    throw error;
  }
  return payload;
}

export const apiBase = API_URL;

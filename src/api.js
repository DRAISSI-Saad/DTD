const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.details?.join(', ');
    throw new Error(detail || payload.error || `Erreur HTTP ${response.status}`);
  }
  return payload;
}

export const apiBase = API_URL;

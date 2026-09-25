const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) throw new Error('API path must start with /');
  return `${API_BASE_URL}${path}`;
}

export const apiBaseUrl = API_BASE_URL;

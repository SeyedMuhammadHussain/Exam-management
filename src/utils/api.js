const API_BASE = import.meta.env.VITE_API_URL || '/api'
let token = localStorage.getItem('oes-token')

export function setToken(value) {
  token = value || null
  if (token) localStorage.setItem('oes-token', token)
  else localStorage.removeItem('oes-token')
}

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && token) setToken(null)
    const message = payload.message || (response.status >= 500
      ? `Backend API is unavailable (HTTP ${response.status}). Start the backend and verify its PostgreSQL configuration.`
      : `Request failed (${response.status}).`)
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return payload.data
}

export const apiError = error => error?.message || 'The server could not complete the request.'

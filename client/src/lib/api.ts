import { getAccessToken, refreshAccessToken, clearTokens } from './auth'

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  let response = await fetch(url, { ...options, headers })

  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, { ...options, headers })
    } else {
      clearTokens()
      window.location.href = '/login'
    }
  }

  return response
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiFetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ title: 'Request failed' }))
    throw new Error(error.title || `HTTP ${response.status}`)
  }
  return response.json()
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ title: 'Request failed' }))
    throw new Error(error.title || `HTTP ${response.status}`)
  }
  return response.json()
}

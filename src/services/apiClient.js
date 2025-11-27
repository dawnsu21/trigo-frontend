import { API_BASE_URL } from '../config'

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

export async function apiRequest(path, { method = 'GET', body, token, headers, ...rest } = {}) {
  const mergedHeaders = {
    ...defaultHeaders,
    ...headers,
  }

  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: mergedHeaders,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // no body available
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed')
    error.status = response.status
    error.data = payload
    throw error
  }

  return payload
}


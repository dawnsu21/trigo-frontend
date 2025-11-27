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

  const url = `${API_BASE_URL}${path}`
  console.log(`[API] ${method} ${url}`, { body, headers: mergedHeaders })
  
  let response
  try {
    response = await fetch(url, {
      method,
      headers: mergedHeaders,
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    })
    console.log(`[API] Response status: ${response.status}`, response)
  } catch (networkError) {
    // Handle network errors (CORS, connection refused, etc.)
    const error = new Error(networkError.message || 'Network error: Could not connect to server')
    error.status = 0
    error.data = { message: 'Please check if the backend server is running and CORS is configured correctly' }
    throw error
  }

  let payload = null
  try {
    const text = await response.text()
    if (text) {
      payload = JSON.parse(text)
    }
    console.log(`[API] Response payload:`, payload)
  } catch (parseError) {
    console.error(`[API] Failed to parse response:`, parseError)
    // no valid JSON body available
  }

  if (!response.ok) {
    const errorMessage = payload?.message || payload?.error || payload?.data?.message || `Request failed with status ${response.status}`
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = payload
    console.error(`[API] Request failed:`, { status: response.status, payload, errorMessage })
    throw error
  }

  console.log(`[API] Request successful:`, payload)
  return payload
}


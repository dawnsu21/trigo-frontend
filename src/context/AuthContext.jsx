import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../config'
import { apiRequest } from '../services/apiClient'
import { AuthContext } from './auth-context'

const tokenFromStorage = () => localStorage.getItem(STORAGE_KEYS.token) || ''
const roleFromStorage = () => localStorage.getItem(STORAGE_KEYS.role) || ''

export function AuthProvider({ children }) {
  const [token, setToken] = useState(tokenFromStorage)
  const [role, setRole] = useState(roleFromStorage)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const isAuthenticated = Boolean(token)

  const persistAuth = useCallback((nextToken, nextRole) => {
    setToken(nextToken)
    setRole(nextRole)
    if (nextToken) {
      localStorage.setItem(STORAGE_KEYS.token, nextToken)
    } else {
      localStorage.removeItem(STORAGE_KEYS.token)
    }
    if (nextRole) {
      localStorage.setItem(STORAGE_KEYS.role, nextRole)
    } else {
      localStorage.removeItem(STORAGE_KEYS.role)
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      const data = await apiRequest('/api/login', {
        method: 'POST',
        body: { email, password },
      })
      const derivedRole = data?.role || data?.user?.role || data?.user?.roles?.[0]?.name || ''
      persistAuth(data?.token, derivedRole)
      setUser(data?.user || null)
      return data
    } finally {
      setLoading(false)
    }
  }, [persistAuth])

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiRequest('/api/logout', {
          method: 'POST',
          token,
        })
      }
    } catch {
      // ignore network errors on logout
    } finally {
      persistAuth('', '')
      setUser(null)
    }
  }, [token, persistAuth])

  const registerPassenger = useCallback(async (form) => {
    return apiRequest('/api/register/passenger', {
      method: 'POST',
      body: form,
    })
  }, [])

  const registerDriver = useCallback(async (form) => {
    return apiRequest('/api/register/driver', {
      method: 'POST',
      body: form,
    })
  }, [])

  const fetchMe = useCallback(async () => {
    if (!token) return null
    setLoading(true)
    try {
      const data = await apiRequest('/api/me', {
        method: 'GET',
        token,
      })
      setUser(data)
      return data
    } catch (error) {
      if (error.status === 401) {
        persistAuth('', '')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }, [token, persistAuth])

  useEffect(() => {
    if (token && !user) {
      fetchMe().catch(() => {})
    }
  }, [token, user, fetchMe])

  const value = useMemo(() => ({
    token,
    role,
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    registerPassenger,
    registerDriver,
    fetchMe,
  }), [token, role, user, loading, isAuthenticated, login, logout, registerPassenger, registerDriver, fetchMe])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


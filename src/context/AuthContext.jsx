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
      console.log('[Auth] Attempting login with:', { email })
      const data = await apiRequest('/api/login', {
        method: 'POST',
        body: { email, password },
      })
      console.log('[Auth] Login response received:', data)
      
      // Backend response structure: { token, user, role, roles }
      const token = data?.token
      const user = data?.user
      const role = data?.role || data?.roles?.[0] || ''
      
      console.log('[Auth] Extracted values:', { token: !!token, role, hasUser: !!user })
      
      if (!token) {
        throw new Error('No token received from server')
      }
      
      if (!role) {
        console.warn('[Auth] No role received from server, using default')
      }
      
      persistAuth(token, role)
      setUser(user || null)
      console.log('[Auth] Login successful, token saved')
      return { ...data, role } // Ensure role is included in return value
    } catch (error) {
      console.error('[Auth] Login failed:', {
        message: error.message,
        status: error.status,
        data: error.data,
        fullError: error
      })
      // Re-throw the error so components can handle it
      throw error
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
    const payload = {
      ...form,
      role: 'passenger',
    }
    console.log('[Auth] Registering passenger with role:', payload.role)
    return apiRequest('/api/register', {
      method: 'POST',
      body: payload,
    })
  }, [])

  const registerDriver = useCallback(async (form) => {
    // Validate required fields
    if (!form.name || !form.email || !form.password) {
      throw new Error('Please fill in all required fields')
    }

    if (!form.vehicle_make || !form.vehicle_model) {
      throw new Error('Vehicle make and model are required')
    }

    if (!form.license_plate || !form.license_number) {
      throw new Error('License plate and license number are required')
    }

    // Combine vehicle_make and vehicle_model into vehicle_type (required by backend)
    const vehicle_type = [form.vehicle_make, form.vehicle_model]
      .filter(Boolean)
      .join(' ')
      .trim()
    
    if (!vehicle_type) {
      throw new Error('Vehicle make and model cannot be empty')
    }
    
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
      // Send both individual fields and combined vehicle_type
      vehicle_make: form.vehicle_make.trim(),
      vehicle_model: form.vehicle_model.trim(),
      vehicle_type: vehicle_type,
      // Backend expects plate_number (maps from license_plate)
      license_plate: form.license_plate.trim(),
      plate_number: form.license_plate.trim(), // Backend validation requires this field name
      license_number: form.license_number.trim(),
      role: 'driver',
    }
    
    console.log('[Auth] Registering driver with payload:', {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      vehicle_make: payload.vehicle_make,
      vehicle_model: payload.vehicle_model,
      vehicle_type: payload.vehicle_type,
      license_plate: payload.license_plate,
      plate_number: payload.plate_number,
      license_number: payload.license_number,
      role: payload.role,
      hasPassword: !!payload.password,
    })
    
    try {
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: payload,
      })
      console.log('[Auth] Driver registration successful:', response)
      return response
    } catch (error) {
      console.error('[Auth] Driver registration failed:', error)
      throw error
    }
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


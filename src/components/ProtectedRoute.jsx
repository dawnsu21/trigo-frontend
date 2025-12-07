import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Make role comparison case-insensitive
  const roleLower = role?.toLowerCase() || ''
  const allowedRolesLower = allowedRoles?.map(r => r?.toLowerCase()) || []

  if (allowedRoles && allowedRoles.length > 0 && !allowedRolesLower.includes(roleLower)) {
    console.warn("[ProtectedRoute] Role mismatch:", {
      userRole: role,
      userRoleLower: roleLower,
      allowedRoles,
      allowedRolesLower,
      isAuthenticated
    })
    return <Navigate to="/" replace />
  }

  return children
}


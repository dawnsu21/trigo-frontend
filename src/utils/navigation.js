/**
 * Navigate to the appropriate dashboard based on user role
 * @param {string} role - User role (admin, driver, or passenger)
 * @param {Function} navigate - React Router navigate function
 */
export function navigateToDashboard(role, navigate) {
  const roleLower = role?.toLowerCase() || ''
  
  if (roleLower === 'admin') {
    navigate('/admin/dashboard')
  } else if (roleLower === 'driver') {
    navigate('/driver/dashboard')
  } else {
    // Default to passenger dashboard
    navigate('/passenger/dashboard')
  }
}


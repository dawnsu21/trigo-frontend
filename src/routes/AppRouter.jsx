import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import LandingPage from '../pages/LandingPage'
import PassengerSignup from '../pages/passenger/PassengerSignup'
import PassengerLogin from '../pages/passenger/PassengerLogin'
import PassengerDashboard from '../pages/passenger/PassengerDashboard'
import DriverLogin from '../pages/driver/DriverLogin'
import DriverSignup from '../pages/driver/DriverSignup'
import DriverDashboard from '../pages/driver/DriverDashboard'
import AdminLogin from '../pages/admin/AdminLogin'
import AdminDashboard from '../pages/admin/AdminDashboard'
import { ProtectedRoute } from '../components/ProtectedRoute'

function NotFound() {
  return (
    <main style={{ padding: '2rem' }}>
      <h2>Page not found</h2>
    </main>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/passenger/signup" element={<PassengerSignup />} />
          <Route path="/passenger/login" element={<PassengerLogin />} />
          <Route
            path="/passenger/dashboard"
            element={
              <ProtectedRoute allowedRoles={['passenger']}>
                <PassengerDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/signup" element={<DriverSignup />} />
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}


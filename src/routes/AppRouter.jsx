import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import LandingPage from '../pages/LandingPage'
import PassengerSignup from '../pages/passenger/PassengerSignup'
import PassengerLogin from '../pages/passenger/PassengerLogin'
import PassengerDashboard from '../pages/passenger/PassengerDashboard.jsx'
import PassengerProfile from '../pages/passenger/PassengerProfile'
import ViewBooking from '../pages/passenger/ViewBooking'
import DriverLogin from '../pages/driver/DriverLogin'
import DriverSignup from '../pages/driver/DriverSignup'
import DriverDashboard from '../pages/driver/DriverDashboard'
import DriverProfile from '../pages/driver/DriverProfile'
import DriverTripHistory from '../pages/driver/DriverTripHistory'
import DriverFeedbacks from '../pages/driver/DriverFeedbacks'
import AdminLogin from '../pages/admin/AdminLogin'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AllAccounts from '../pages/admin/AllAccounts'
import PassengerAccounts from '../pages/admin/PassengerAccounts'
import PassengerFeedbacks from '../pages/admin/PassengerFeedbacks'
import TripHistory from '../pages/admin/TripHistory'
import Statistics from '../pages/admin/Statistics'
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
          <Route
            path="/passenger/profile"
            element={
              <ProtectedRoute allowedRoles={['passenger']}>
                <PassengerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passenger/view-booking"
            element={
              <ProtectedRoute allowedRoles={['passenger']}>
                <ViewBooking />
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
          <Route
            path="/driver/profile"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/trip-history"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverTripHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/feedbacks"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverFeedbacks />
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
          <Route
            path="/admin/accounts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/passengers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PassengerAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedbacks"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PassengerFeedbacks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trip-history"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TripHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/statistics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Statistics />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}


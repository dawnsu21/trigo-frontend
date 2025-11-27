import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  fetchAdminDashboard,
  fetchAdminDrivers,
  fetchAdminRides,
  updateDriverStatus,
} from '../../services/adminService'
import '../../styles/dashboard.css'

export default function AdminDashboard() {
  const { token, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [rides, setRides] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAdminDashboard(token)
      setStats(data)
    } catch (err) {
      setError(err?.message ?? 'Unable to load dashboard stats')
    }
  }, [token])

  const loadDrivers = useCallback(async () => {
    try {
      const data = await fetchAdminDrivers(token)
      setDrivers(data || [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load drivers')
    }
  }, [token])

  const loadRides = useCallback(async () => {
    try {
      const data = await fetchAdminRides(token)
      setRides(data || [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load rides')
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadStats()
      loadDrivers()
      loadRides()
    }
  }, [token, loadStats, loadDrivers, loadRides])

  const handleDriverStatus = async (driverId, status) => {
    setBusy(true)
    try {
      await updateDriverStatus(token, driverId, status)
      await loadDrivers()
    } catch (err) {
      setError(err?.data?.message || 'Unable to update status')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Operational overview</p>
        </div>
        <button onClick={logout} className="secondary">Logout</button>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="dashboard__grid">
        <article className="panel">
          <h3>Platform Stats</h3>
          <dl className="details">
            <div>
              <dt>Passengers</dt>
              <dd>{stats?.passengers}</dd>
            </div>
            <div>
              <dt>Drivers</dt>
              <dd>{stats?.drivers}</dd>
            </div>
            <div>
              <dt>Active Rides</dt>
              <dd>{stats?.active_rides}</dd>
            </div>
            <div>
              <dt>Today Revenue</dt>
              <dd>{stats?.today_revenue}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel__header">
            <h3>Driver Approvals</h3>
            <button className="secondary" onClick={loadDrivers}>Refresh</button>
          </div>
          {drivers.length === 0 && <p>No drivers found.</p>}
          {drivers.map((driver) => (
            <div className="queue__item" key={driver.id}>
              <div>
                <h4>{driver.name}</h4>
                <p>Status: {driver.status}</p>
              </div>
              <div className="queue__actions">
                <button
                  disabled={busy}
                  onClick={() => handleDriverStatus(driver.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => handleDriverStatus(driver.id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Ride Monitor</h3>
          <button className="secondary" onClick={loadRides}>Refresh</button>
        </div>
        {rides.length === 0 && <p>No rides.</p>}
        <div className="table">
          {rides.map((ride) => (
            <div className="table__row" key={ride.id}>
              <span>#{ride.id}</span>
              <span>{ride.passenger?.name}</span>
              <span>{ride.driver?.name || 'Unassigned'}</span>
              <span>{ride.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


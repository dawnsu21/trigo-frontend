import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  driverRideAction,
  fetchDriverProfile,
  fetchDriverQueue,
  updateDriverAvailability,
  updateDriverLocation,
} from '../../services/driverService'
import '../../styles/dashboard.css'

const locationDefaults = {
  lat: '',
  lng: '',
}

export default function DriverDashboard() {
  const { token, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [queue, setQueue] = useState([])
  const [availability, setAvailability] = useState(false)
  const [location, setLocation] = useState(locationDefaults)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchDriverProfile(token)
      setProfile(data)
      setAvailability(data?.is_online)
    } catch (err) {
      setError(err?.message ?? 'Unable to load profile')
    }
  }, [token])

  const loadQueue = useCallback(async () => {
    try {
      const data = await fetchDriverQueue(token)
      setQueue(data || [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load ride queue')
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadProfile()
      loadQueue()
    }
  }, [token, loadProfile, loadQueue])

  const toggleAvailability = async () => {
    setBusy(true)
    try {
      await updateDriverAvailability(token, { is_online: !availability })
      setAvailability((prev) => !prev)
    } catch (err) {
      setError(err?.data?.message || 'Unable to update status')
    } finally {
      setBusy(false)
    }
  }

  const submitLocation = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await updateDriverLocation(token, location)
      setLocation(locationDefaults)
    } catch (err) {
      setError(err?.data?.message || 'Location update failed')
    } finally {
      setBusy(false)
    }
  }

  const handleRideAction = async (rideId, action) => {
    setBusy(true)
    setError('')
    try {
      await driverRideAction(token, rideId, action)
      await loadQueue()
    } catch (err) {
      setError(err?.data?.message || 'Ride action failed')
    } finally {
      setBusy(false)
    }
  }

  const needsApproval = profile && profile.status !== 'approved'

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Driver Console</h2>
          <p>{profile?.vehicle_make} {profile?.vehicle_model}</p>
          {needsApproval && <span className="alert alert--error">Awaiting admin approval</span>}
        </div>
        <button onClick={logout} className="secondary">Logout</button>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="dashboard__grid">
        <article className="panel">
          <h3>Availability</h3>
          <p>Status: <strong>{availability ? 'Online' : 'Offline'}</strong></p>
          <button onClick={toggleAvailability} disabled={busy || needsApproval}>
            {availability ? 'Go Offline' : 'Go Online'}
          </button>
        </article>

        <article className="panel">
          <h3>Location</h3>
          <form className="form form--stacked" onSubmit={submitLocation}>
            <div className="form__grid">
              <label>
                Latitude
                <input name="lat" value={location.lat} onChange={(e) => setLocation((prev) => ({ ...prev, lat: e.target.value }))} required />
              </label>
              <label>
                Longitude
                <input name="lng" value={location.lng} onChange={(e) => setLocation((prev) => ({ ...prev, lng: e.target.value }))} required />
              </label>
            </div>
            <button type="submit" disabled={busy || needsApproval}>
              Update Location
            </button>
          </form>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Ride Queue</h3>
          <button className="secondary" onClick={loadQueue}>Refresh</button>
        </div>
        {queue.length === 0 && <p>No rides waiting.</p>}
        {queue.map((ride) => (
          <div className="queue__item" key={ride.id}>
            <div>
              <h4>Ride #{ride.id}</h4>
              <p>{ride.pickup_address} → {ride.dropoff_address}</p>
              <p>Fare: {ride.fare}</p>
            </div>
            <div className="queue__actions">
              {ride.status === 'pending' && (
                <button onClick={() => handleRideAction(ride.id, 'accept')} disabled={busy}>Accept</button>
              )}
              {ride.status === 'accepted' && (
                <button onClick={() => handleRideAction(ride.id, 'pickup')} disabled={busy}>Pickup</button>
              )}
              {ride.status === 'picked_up' && (
                <button onClick={() => handleRideAction(ride.id, 'complete')} disabled={busy}>Complete</button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}


import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  cancelPassengerRide,
  createPassengerRide,
  fetchCurrentPassengerRide,
  fetchPassengerHistory,
} from '../../services/passengerService'
import '../../styles/dashboard.css'

const rideDefaults = {
  pickup_lat: '',
  pickup_lng: '',
  drop_lat: '',
  drop_lng: '',
  notes: '',
}

export default function PassengerDashboard() {
  const { user, token, logout } = useAuth()
  const [rideForm, setRideForm] = useState(rideDefaults)
  const [currentRide, setCurrentRide] = useState(null)
  const [history, setHistory] = useState([])
  const [page, setPage] = useState(1)
  const [loadingRide, setLoadingRide] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setRideForm((prev) => ({ ...prev, [name]: value }))
  }

  const loadCurrentRide = useCallback(async () => {
    try {
      const data = await fetchCurrentPassengerRide(token)
      setCurrentRide(data)
    } catch (err) {
      setError(err?.message ?? 'Unable to load current ride')
    }
  }, [token])

  const loadHistory = useCallback(async (nextPage = 1) => {
    try {
      const data = await fetchPassengerHistory(token, nextPage)
      setHistory(data?.data || [])
      setPage(nextPage)
    } catch (err) {
      setError(err?.message ?? 'Unable to load ride history')
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadCurrentRide()
      loadHistory()
    }
  }, [token, loadCurrentRide, loadHistory])

  const submitRide = async (event) => {
    event.preventDefault()
    setLoadingRide(true)
    setError('')
    try {
      await createPassengerRide(token, rideForm)
      setRideForm(rideDefaults)
      await loadCurrentRide()
      await loadHistory()
    } catch (err) {
      setError(err?.data?.message || 'Ride request failed')
    } finally {
      setLoadingRide(false)
    }
  }

  const cancelRide = async () => {
    if (!currentRide?.id) return
    setLoadingRide(true)
    try {
      await cancelPassengerRide(token, currentRide.id)
      setCurrentRide(null)
      await loadHistory()
    } catch (err) {
      setError(err?.data?.message || 'Unable to cancel ride')
    } finally {
      setLoadingRide(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Passenger Dashboard</h2>
          <p>Welcome back, {user?.name}</p>
        </div>
        <button onClick={logout} className="secondary">
          Logout
        </button>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="dashboard__grid">
        <article className="panel">
          <h3>Book a Ride</h3>
          <form className="form form--stacked" onSubmit={submitRide}>
            <div className="form__grid">
              <label>
                Pickup Lat
                <input name="pickup_lat" value={rideForm.pickup_lat} onChange={handleChange} required />
              </label>
              <label>
                Pickup Lng
                <input name="pickup_lng" value={rideForm.pickup_lng} onChange={handleChange} required />
              </label>
              <label>
                Drop Lat
                <input name="drop_lat" value={rideForm.drop_lat} onChange={handleChange} required />
              </label>
              <label>
                Drop Lng
                <input name="drop_lng" value={rideForm.drop_lng} onChange={handleChange} required />
              </label>
            </div>
            <label>
              Notes
              <textarea name="notes" value={rideForm.notes} onChange={handleChange} rows={3} />
            </label>
            <button type="submit" disabled={loadingRide}>
              {loadingRide ? 'Submitting...' : 'Request Ride'}
            </button>
          </form>
        </article>

        <article className="panel">
          <h3>Current Ride</h3>
          {currentRide ? (
            <>
              <dl className="details">
                <div>
                  <dt>Status</dt>
                  <dd>{currentRide.status}</dd>
                </div>
                <div>
                  <dt>Driver</dt>
                  <dd>{currentRide.driver?.name || 'Finding driver'}</dd>
                </div>
                <div>
                  <dt>Fare</dt>
                  <dd>{currentRide.fare}</dd>
                </div>
              </dl>
              <button className="secondary" onClick={cancelRide} disabled={loadingRide}>
                Cancel Ride
              </button>
            </>
          ) : (
            <p>No active ride.</p>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Ride History</h3>
          <div>
            <button className="secondary" onClick={() => loadHistory(page - 1)} disabled={page <= 1}>
              Prev
            </button>
            <button className="secondary" onClick={() => loadHistory(page + 1)}>
              Next
            </button>
          </div>
        </div>
        <div className="table">
          <div className="table__head">
            <span>ID</span>
            <span>Status</span>
            <span>Fare</span>
            <span>Updated</span>
          </div>
          {history.map((ride) => (
            <div className="table__row" key={ride.id}>
              <span>{ride.id}</span>
              <span>{ride.status}</span>
              <span>{ride.fare}</span>
              <span>{new Date(ride.updated_at).toLocaleString()}</span>
            </div>
          ))}
          {history.length === 0 && <p>No rides yet.</p>}
        </div>
      </section>
    </div>
  )
}


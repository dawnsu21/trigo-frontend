import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  cancelPassengerRide,
  createPassengerRide,
  fetchCurrentPassengerRide,
  fetchPassengerHistory,
} from '../../services/passengerService'
import PlaceSelector from '../../components/PlaceSelector'
import '../../styles/dashboard.css'

const rideDefaults = {
  pickup_place_id: '',
  dropoff_place_id: '',
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
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setRideForm((prev) => ({ ...prev, [name]: value }))
  }

  const loadCurrentRide = useCallback(async () => {
    try {
      const data = await fetchCurrentPassengerRide(token)
      setCurrentRide(data || null)
    } catch (err) {
      // If no current ride, that's okay - set to null
      if (err?.status === 404) {
        setCurrentRide(null)
      } else {
        setError(err?.message || err?.data?.message || 'Unable to load current ride')
      }
    }
  }, [token])

  const loadHistory = useCallback(async (nextPage = 1) => {
    try {
      const data = await fetchPassengerHistory(token, nextPage)
      // Handle different response formats
      if (Array.isArray(data)) {
        setHistory(data)
      } else if (data?.data) {
        setHistory(data.data)
      } else {
        setHistory([])
      }
      setPage(nextPage)
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Unable to load ride history')
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadCurrentRide()
      loadHistory()
      
      // Auto-refresh current ride every 10 seconds if there's an active ride
      const interval = setInterval(() => {
        loadCurrentRide()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [token, loadCurrentRide, loadHistory])

  const submitRide = async (event) => {
    event.preventDefault()
    setLoadingRide(true)
    setError('')
    setSuccess('')
    try {
      const data = await createPassengerRide(token, rideForm)
      setRideForm(rideDefaults)
      setSuccess('Ride requested successfully! Searching for available drivers...')
      setError('')
      // Reload data after short delay
      setTimeout(() => {
        loadCurrentRide()
        loadHistory()
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Ride request failed. Please try again.')
      setSuccess('')
    } finally {
      setLoadingRide(false)
    }
  }

  const cancelRide = async () => {
    if (!currentRide?.id) return
    if (!window.confirm('Are you sure you want to cancel this ride?')) return
    
    setLoadingRide(true)
    setError('')
    setSuccess('')
    try {
      await cancelPassengerRide(token, currentRide.id)
      setCurrentRide(null)
      setSuccess('Ride cancelled successfully.')
      await loadHistory()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Unable to cancel ride. Please try again.')
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
      {success && <div className="alert alert--success">{success}</div>}

      <section className="dashboard__grid">
        <article className="panel">
          <h3>Book a Ride</h3>
          <p className="panel__description">Select your pickup and drop-off locations in Bulan to request a tricycle ride.</p>
          <form className="form form--stacked" onSubmit={submitRide}>
            <div className="form__section">
              <h4>Pickup Location</h4>
              <PlaceSelector
                name="pickup_place_id"
                label="Where will you be picked up?"
                value={rideForm.pickup_place_id}
                onChange={handleChange}
                placeholder="Search for pickup location (e.g., Bulan Public Market, Barangay Poblacion...)"
                required
              />
            </div>
            
            <div className="form__section">
              <h4>Drop-off Location</h4>
              <PlaceSelector
                name="dropoff_place_id"
                label="Where do you want to go?"
                value={rideForm.dropoff_place_id}
                onChange={handleChange}
                placeholder="Search for destination (e.g., Bulan Port, Bulan Town Plaza...)"
                required
              />
            </div>
            
            <label>
              Additional Notes (Optional)
              <textarea 
                name="notes" 
                value={rideForm.notes} 
                onChange={handleChange} 
                rows={3}
                placeholder="Any special instructions for the driver (e.g., 'Please wait at the main entrance', 'I have luggage')..."
              />
              <small>Add any special instructions or notes for the driver</small>
            </label>
            <button type="submit" disabled={loadingRide || !rideForm.pickup_place_id || !rideForm.dropoff_place_id}>
              {loadingRide ? 'Requesting Ride...' : 'Request Ride'}
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Current Ride</h3>
              <p className="panel__description">Track your active ride in real-time</p>
            </div>
            <button className="secondary" onClick={loadCurrentRide}>Refresh</button>
          </div>
          {currentRide ? (
            <>
              <dl className="details">
                <div>
                  <dt>Ride Number</dt>
                  <dd>#{currentRide.id}</dd>
                </div>
                <div>
                  <dt>Current Status</dt>
                  <dd>
                    <span className={`status status--${currentRide.status?.toLowerCase().replace('_', '-')}`}>
                      {currentRide.status === 'pending' && 'Waiting for Driver'}
                      {currentRide.status === 'accepted' && 'Driver Assigned'}
                      {currentRide.status === 'picked_up' && 'On the Way'}
                      {currentRide.status === 'completed' && 'Completed'}
                      {currentRide.status === 'cancelled' && 'Cancelled'}
                      {!['pending', 'accepted', 'picked_up', 'completed', 'cancelled'].includes(currentRide.status) && currentRide.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Your Driver</dt>
                  <dd>
                    {currentRide.driver ? (
                      <>
                        <strong>{currentRide.driver.name}</strong>
                        {currentRide.driver.phone && (
                          <>
                            <br />
                            <small>Contact: {currentRide.driver.phone}</small>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">Searching for available driver...</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Vehicle Type</dt>
                  <dd>{currentRide.driver?.vehicle_type || 'Not assigned yet'}</dd>
                </div>
                <div>
                  <dt>Estimated Fare</dt>
                  <dd>₱{currentRide.fare ? parseFloat(currentRide.fare).toFixed(2) : '0.00'}</dd>
                </div>
                {(currentRide.pickup_address || currentRide.pickup_place) && (
                  <div>
                    <dt>Pickup Location</dt>
                    <dd>
                      {currentRide.pickup_place?.name || currentRide.pickup_address}
                      {currentRide.pickup_place?.address && (
                        <>
                          <br />
                          <small className="text-muted">{currentRide.pickup_place.address}</small>
                        </>
                      )}
                    </dd>
                  </div>
                )}
                {(currentRide.dropoff_address || currentRide.dropoff_place) && (
                  <div>
                    <dt>Destination</dt>
                    <dd>
                      {currentRide.dropoff_place?.name || currentRide.dropoff_address}
                      {currentRide.dropoff_place?.address && (
                        <>
                          <br />
                          <small className="text-muted">{currentRide.dropoff_place.address}</small>
                        </>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              {['pending', 'accepted'].includes(currentRide.status) && (
                <button className="secondary" onClick={cancelRide} disabled={loadingRide}>
                  {loadingRide ? 'Cancelling...' : 'Cancel This Ride'}
                </button>
              )}
            </>
          ) : (
            <div className="panel__empty">
              <p>You don't have an active ride right now.</p>
              <p className="text-muted">Use the "Book a Ride" form to request a tricycle ride.</p>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Ride History</h3>
            <p className="panel__description">View all your past and completed rides</p>
          </div>
          <div>
            <button className="secondary" onClick={() => loadHistory(page - 1)} disabled={page <= 1}>
              Previous
            </button>
            <button className="secondary" onClick={() => loadHistory(page + 1)}>
              Next
            </button>
          </div>
        </div>
        {history.length === 0 ? (
          <div className="panel__empty">
            <p>You haven't taken any rides yet.</p>
            <p className="text-muted">Your ride history will appear here after you book your first ride.</p>
          </div>
        ) : (
          <div className="table">
          <div className="table__head">
            <span>Ride #</span>
            <span>Ride Details</span>
            <span>Status</span>
            <span>Fare Amount</span>
            <span>Date</span>
          </div>
            {history.map((ride) => (
              <div className="table__row" key={ride.id}>
                <span>#{ride.id}</span>
                <span>
                  <div>
                    {ride.driver ? (
                      <>
                        <strong>{ride.driver.name}</strong>
                        {ride.driver.vehicle_type && (
                          <>
                            <br />
                            <small className="text-muted">{ride.driver.vehicle_type}</small>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">No driver assigned</span>
                    )}
                  </div>
                  {(ride.pickup_place || ride.pickup_address) && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      <strong>From:</strong> {ride.pickup_place?.name || ride.pickup_address}
                    </div>
                  )}
                  {(ride.dropoff_place || ride.dropoff_address) && (
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong>To:</strong> {ride.dropoff_place?.name || ride.dropoff_address}
                    </div>
                  )}
                </span>
                <span>
                  <span className={`status status--${ride.status?.toLowerCase().replace('_', '-')}`}>
                    {ride.status === 'completed' && 'Completed'}
                    {ride.status === 'cancelled' && 'Cancelled'}
                    {ride.status === 'pending' && 'Pending'}
                    {!['completed', 'cancelled', 'pending'].includes(ride.status) && ride.status}
                  </span>
                </span>
                <span>₱{ride.fare ? parseFloat(ride.fare).toFixed(2) : '0.00'}</span>
                <span>
                  {ride.created_at ? new Date(ride.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 
                   ride.updated_at ? new Date(ride.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}


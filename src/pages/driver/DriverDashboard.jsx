import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  driverRideAction,
  fetchDriverProfile,
  fetchDriverQueue,
  updateDriverAvailability,
  updateDriverLocation,
} from "../../services/driverService";
import "../../styles/dashboard.css";

const locationDefaults = {
  lat: "",
  lng: "",
};

export default function DriverDashboard() {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [queue, setQueue] = useState([]);
  const [availability, setAvailability] = useState(false);
  const [location, setLocation] = useState(locationDefaults);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchDriverProfile(token);
      setProfile(data);
      setAvailability(data?.is_online);
    } catch (err) {
      setError(err?.message ?? "Unable to load profile");
    }
  }, [token]);

  const loadQueue = useCallback(async () => {
    try {
      const data = await fetchDriverQueue(token);
      setQueue(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(
        err?.message || err?.data?.message || "Unable to load ride queue"
      );
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadProfile();
      loadQueue();

      // Auto-refresh queue every 15 seconds when online
      const interval = setInterval(() => {
        if (availability) {
          loadQueue();
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [token, availability, loadProfile, loadQueue]);

  const toggleAvailability = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateDriverAvailability(token, { is_online: !availability });
      const newStatus = !availability;
      setAvailability(newStatus);
      setSuccess(
        newStatus
          ? "You are now online and will receive ride requests!"
          : "You are now offline."
      );
      // Reload queue when going online to get new rides
      if (newStatus) {
        await loadQueue();
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to update status. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const submitLocation = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateDriverLocation(token, location);
      setLocation(locationDefaults);
      setSuccess("Location updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Location update failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRideAction = async (rideId, action) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await driverRideAction(token, rideId, action);
      // Reload queue to get updated ride status
      await loadQueue();

      // Show success message based on action
      const messages = {
        accept: "Ride accepted! Please proceed to pickup location.",
        pickup: "Passenger picked up! Ride in progress.",
        complete: "Ride completed successfully!",
      };
      setSuccess(messages[action] || "Action completed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Action failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const needsApproval = profile && profile.status !== "approved";

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Driver Console</h2>
          <p>
            {profile?.vehicle_make} {profile?.vehicle_model}
          </p>
          {needsApproval && (
            <span className="alert alert--error">Awaiting admin approval</span>
          )}
        </div>
        <button onClick={logout} className="secondary">
          Logout
        </button>
      </header>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <section className="dashboard__grid">
        <article className="panel">
          <h3>Online Status</h3>
          <p className="panel__description">
            Toggle your availability to receive ride requests
          </p>
          <div className="details">
            <div>
              <dt>Current Status</dt>
              <dd>
                <strong
                  className={availability ? "text-success" : "text-muted"}
                >
                  {availability
                    ? "🟢 Online - Receiving Rides"
                    : "🔴 Offline - Not Available"}
                </strong>
              </dd>
            </div>
          </div>
          <button onClick={toggleAvailability} disabled={busy || needsApproval}>
            {busy ? "Updating..." : availability ? "Go Offline" : "Go Online"}
          </button>
          {needsApproval && (
            <p
              className="text-muted"
              style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}
            >
              You must be approved by an administrator before going online.
            </p>
          )}
        </article>

        <article className="panel">
          <h3>Update Your Location</h3>
          <p className="panel__description">
            Keep your location updated so passengers can find you
          </p>
          <form className="form form--stacked" onSubmit={submitLocation}>
            <div className="form__grid">
              <label>
                Latitude Coordinate
                <input
                  name="lat"
                  type="number"
                  step="any"
                  value={location.lat}
                  onChange={(e) =>
                    setLocation((prev) => ({ ...prev, lat: e.target.value }))
                  }
                  placeholder="e.g., 14.5995"
                  required
                />
                <small>Your current latitude position</small>
              </label>
              <label>
                Longitude Coordinate
                <input
                  name="lng"
                  type="number"
                  step="any"
                  value={location.lng}
                  onChange={(e) =>
                    setLocation((prev) => ({ ...prev, lng: e.target.value }))
                  }
                  placeholder="e.g., 120.9842"
                  required
                />
                <small>Your current longitude position</small>
              </label>
            </div>
            <button type="submit" disabled={busy || needsApproval}>
              {busy ? "Updating..." : "Update My Location"}
            </button>
          </form>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Available Rides</h3>
            <p className="panel__description">
              View and manage ride requests from passengers
            </p>
          </div>
          <button className="secondary" onClick={loadQueue}>
            Refresh List
          </button>
        </div>
        {!availability && (
          <div className="alert" style={{ marginBottom: "1rem" }}>
            <strong>You're currently offline.</strong> Go online to see
            available ride requests.
          </div>
        )}
        {queue.length === 0 && availability && (
          <div className="panel__empty">
            <p>No ride requests available at the moment.</p>
            <p className="text-muted">
              New ride requests will appear here when passengers book rides.
            </p>
          </div>
        )}
        {queue.length === 0 && !availability && (
          <div className="panel__empty">
            <p>You're offline. Go online to receive ride requests.</p>
          </div>
        )}
        {queue.map((ride) => (
          <div className="queue__item" key={ride.id}>
            <div>
              <h4>Ride Request #{ride.id}</h4>
              {ride.passenger && (
                <div className="details" style={{ marginTop: "0.5rem" }}>
                  <div>
                    <dt>Passenger Name</dt>
                    <dd>
                      <strong>{ride.passenger.name}</strong>
                    </dd>
                  </div>
                  {ride.passenger.phone && (
                    <div>
                      <dt>Contact Number</dt>
                      <dd>{ride.passenger.phone}</dd>
                    </div>
                  )}
                </div>
              )}
              <div className="details" style={{ marginTop: "0.5rem" }}>
                <div>
                  <dt>Pickup Location</dt>
                  <dd>
                    {ride.pickup_place?.name ||
                      ride.pickup_address ||
                      (ride.pickup_lat && ride.pickup_lng
                        ? `${ride.pickup_lat}, ${ride.pickup_lng}`
                        : "Not specified")}
                    {ride.pickup_place?.address && (
                      <>
                        <br />
                        <small className="text-muted">
                          {ride.pickup_place.address}
                        </small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>
                    {ride.dropoff_place?.name ||
                      ride.dropoff_address ||
                      (ride.drop_lat && ride.drop_lng
                        ? `${ride.drop_lat}, ${ride.drop_lng}`
                        : "Not specified")}
                    {ride.dropoff_place?.address && (
                      <>
                        <br />
                        <small className="text-muted">
                          {ride.dropoff_place.address}
                        </small>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Fare Amount</dt>
                  <dd>
                    ₱{ride.fare ? parseFloat(ride.fare).toFixed(2) : "0.00"}
                  </dd>
                </div>
                <div>
                  <dt>Current Status</dt>
                  <dd>
                    <span
                      className={`status status--${ride.status
                        ?.toLowerCase()
                        .replace("_", "-")}`}
                    >
                      {ride.status === "pending" && "Waiting for Acceptance"}
                      {ride.status === "accepted" && "Ready for Pickup"}
                      {ride.status === "picked_up" && "In Progress"}
                      {ride.status === "completed" && "Completed"}
                      {![
                        "pending",
                        "accepted",
                        "picked_up",
                        "completed",
                      ].includes(ride.status) && ride.status}
                    </span>
                  </dd>
                </div>
              </div>
              {ride.notes && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    background: "#f8f9fa",
                    borderRadius: "0.5rem",
                  }}
                >
                  <strong>Passenger Notes:</strong> {ride.notes}
                </div>
              )}
            </div>
            <div className="queue__actions">
              {ride.status === "pending" && (
                <button
                  onClick={() => handleRideAction(ride.id, "accept")}
                  disabled={busy || !availability}
                  style={{ minWidth: "120px" }}
                >
                  {busy ? "Processing..." : "Accept This Ride"}
                </button>
              )}
              {ride.status === "accepted" && (
                <button
                  onClick={() => handleRideAction(ride.id, "pickup")}
                  disabled={busy}
                  style={{ minWidth: "120px" }}
                >
                  {busy ? "Processing..." : "Mark as Picked Up"}
                </button>
              )}
              {ride.status === "picked_up" && (
                <button
                  onClick={() => handleRideAction(ride.id, "complete")}
                  disabled={busy}
                  style={{ minWidth: "120px" }}
                >
                  {busy ? "Processing..." : "Complete Ride"}
                </button>
              )}
              {!["pending", "accepted", "picked_up"].includes(ride.status) && (
                <span className="status">{ride.status}</span>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

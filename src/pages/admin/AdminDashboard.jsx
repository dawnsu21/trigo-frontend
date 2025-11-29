import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminDashboard,
  fetchAdminDrivers,
  fetchAdminRides,
  updateDriverStatus,
} from "../../services/adminService";
import "../../styles/dashboard.css";

export default function AdminDashboard() {
  const { token, logout, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log("[AdminDashboard] Component rendered", { token: !!token, user });

  const loadStats = useCallback(async () => {
    try {
      console.log("[AdminDashboard] Loading stats...");
      const data = await fetchAdminDashboard(token);
      console.log("[AdminDashboard] Stats loaded:", data);
      setStats(data);
    } catch (err) {
      console.error("[AdminDashboard] Error loading stats:", err);
      setError(
        err?.message || err?.data?.message || "Unable to load dashboard stats"
      );
    }
  }, [token]);

  const loadDrivers = useCallback(async () => {
    try {
      console.log("[AdminDashboard] Loading drivers...");
      const data = await fetchAdminDrivers(token);
      console.log("[AdminDashboard] Drivers loaded:", data);
      setDrivers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("[AdminDashboard] Error loading drivers:", err);
      setError(err?.message || err?.data?.message || "Unable to load drivers");
    }
  }, [token]);

  const loadRides = useCallback(async () => {
    try {
      console.log("[AdminDashboard] Loading rides...");
      const data = await fetchAdminRides(token);
      console.log("[AdminDashboard] Rides loaded:", data);
      setRides(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("[AdminDashboard] Error loading rides:", err);
      setError(err?.message || err?.data?.message || "Unable to load rides");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError("");
      Promise.all([loadStats(), loadDrivers(), loadRides()])
        .then(() => {
          console.log("[AdminDashboard] All data loaded successfully");
          setLoading(false);
        })
        .catch((err) => {
          console.error("[AdminDashboard] Error loading data:", err);
          setLoading(false);
        });
    } else {
      console.warn("[AdminDashboard] No token available");
      setLoading(false);
    }
  }, [token, loadStats, loadDrivers, loadRides]);

  const handleDriverStatus = async (driverId, status) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateDriverStatus(token, driverId, status);
      // Reload drivers to show updated status
      await loadDrivers();
      setSuccess(
        `Driver ${
          status === "approved" ? "approved" : "rejected"
        } successfully!`
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to update driver status. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="dashboard">
        <div className="alert alert--error">
          Not authenticated. Please log in.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard__header">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Loading...</p>
          </div>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </header>
        <div className="alert">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Operational overview</p>
          {user && <p>Welcome, {user.name || user.email}</p>}
        </div>
        <button onClick={logout} className="secondary">
          Logout
        </button>
      </header>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <section className="dashboard__grid">
        <article className="panel">
          <h3>Platform Statistics</h3>
          <p className="panel__description">
            Overview of your TriGo platform activity
          </p>
          <dl className="details">
            <div>
              <dt>Total Passengers</dt>
              <dd>{stats?.passengers || 0}</dd>
            </div>
            <div>
              <dt>Total Drivers</dt>
              <dd>{stats?.drivers || 0}</dd>
            </div>
            <div>
              <dt>Active Rides</dt>
              <dd>{stats?.active_rides || 0}</dd>
            </div>
            <div>
              <dt>Today's Revenue</dt>
              <dd>
                ₱
                {stats?.today_revenue
                  ? parseFloat(stats.today_revenue).toFixed(2)
                  : "0.00"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Driver Registration Requests</h3>
              <p className="panel__description">
                Review and approve new driver applications
              </p>
            </div>
            <button className="secondary" onClick={loadDrivers}>
              Refresh List
            </button>
          </div>
          {drivers.length === 0 && (
            <div className="panel__empty">
              <p>No driver applications at this time.</p>
            </div>
          )}
          {drivers.map((driver) => (
            <div className="queue__item" key={driver.id}>
              <div>
                <h4>{driver.name || driver.user?.name || "Unknown Driver"}</h4>
                <div className="details" style={{ marginTop: "0.5rem" }}>
                  <div>
                    <dt>Email Address</dt>
                    <dd>
                      {driver.email || driver.user?.email || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt>Phone Number</dt>
                    <dd>
                      {driver.phone || driver.user?.phone || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt>Vehicle Information</dt>
                    <dd>
                      {driver.vehicle_type ||
                        (driver.vehicle_make && driver.vehicle_model
                          ? `${driver.vehicle_make} ${driver.vehicle_model}`
                          : "Not provided")}
                    </dd>
                  </div>
                  <div>
                    <dt>License Plate Number</dt>
                    <dd>
                      {driver.plate_number ||
                        driver.license_plate ||
                        "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt>Application Status</dt>
                    <dd>
                      <span
                        className={`status status--${driver.status?.toLowerCase()}`}
                      >
                        {driver.status === "pending" && "Pending Review"}
                        {driver.status === "approved" && "Approved"}
                        {driver.status === "rejected" && "Rejected"}
                        {!["pending", "approved", "rejected"].includes(
                          driver.status
                        ) && driver.status}
                      </span>
                    </dd>
                  </div>
                </div>
              </div>
              <div className="queue__actions">
                {driver.status !== "approved" && (
                  <button
                    disabled={busy}
                    onClick={() => handleDriverStatus(driver.id, "approved")}
                    style={{ minWidth: "100px" }}
                  >
                    {busy ? "Processing..." : "Approve Driver"}
                  </button>
                )}
                {driver.status !== "rejected" && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => handleDriverStatus(driver.id, "rejected")}
                    style={{ minWidth: "100px" }}
                  >
                    {busy ? "Processing..." : "Reject Application"}
                  </button>
                )}
                {driver.status === "approved" && (
                  <span className="status status--approved">✓ Approved</span>
                )}
              </div>
            </div>
          ))}
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>All Rides Monitor</h3>
            <p className="panel__description">
              Track all rides across the platform
            </p>
          </div>
          <button className="secondary" onClick={loadRides}>
            Refresh Data
          </button>
        </div>
        {rides.length === 0 && (
          <div className="panel__empty">
            <p>No rides have been booked yet.</p>
            <p className="text-muted">
              Ride information will appear here as passengers book rides.
            </p>
          </div>
        )}
        {rides.length > 0 && (
          <div className="table">
            <div className="table__head">
              <span>Ride #</span>
              <span>Passenger</span>
              <span>Driver</span>
              <span>Route</span>
              <span>Status</span>
              <span>Fare</span>
              <span>Date</span>
            </div>
            {rides.map((ride) => (
              <div className="table__row" key={ride.id}>
                <span>#{ride.id}</span>
                <span>
                  {ride.passenger ? (
                    <>
                      <strong>{ride.passenger.name}</strong>
                      {ride.passenger.email && (
                        <>
                          <br />
                          <small className="text-muted">
                            {ride.passenger.email}
                          </small>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">Unknown</span>
                  )}
                </span>
                <span>
                  {ride.driver ? (
                    <>
                      <strong>{ride.driver.name}</strong>
                      {ride.driver.vehicle_type && (
                        <>
                          <br />
                          <small className="text-muted">
                            {ride.driver.vehicle_type}
                          </small>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">Unassigned</span>
                  )}
                </span>
                <span>
                  <div style={{ fontSize: "0.875rem" }}>
                    <strong>From:</strong>{" "}
                    {ride.pickup_place?.name ||
                      ride.pickup_address ||
                      (ride.pickup_lat && ride.pickup_lng
                        ? "Coordinates"
                        : "N/A")}
                  </div>
                  <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>To:</strong>{" "}
                    {ride.dropoff_place?.name ||
                      ride.dropoff_address ||
                      (ride.drop_lat && ride.drop_lng ? "Coordinates" : "N/A")}
                  </div>
                </span>
                <span>
                  <span
                    className={`status status--${ride.status
                      ?.toLowerCase()
                      .replace("_", "-")}`}
                  >
                    {ride.status === "pending" && "Waiting"}
                    {ride.status === "accepted" && "Assigned"}
                    {ride.status === "picked_up" && "In Progress"}
                    {ride.status === "completed" && "Completed"}
                    {ride.status === "cancelled" && "Cancelled"}
                    {![
                      "pending",
                      "accepted",
                      "picked_up",
                      "completed",
                      "cancelled",
                    ].includes(ride.status) && ride.status}
                  </span>
                </span>
                <span>
                  ₱{ride.fare ? parseFloat(ride.fare).toFixed(2) : "0.00"}
                </span>
                <span>
                  {ride.created_at
                    ? new Date(ride.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

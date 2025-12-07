import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminDashboard,
  fetchAdminDrivers,
  fetchAdminRides,
  updateDriverStatus,
} from "../../services/adminService";
import FeedbackNotificationBell from "../../components/FeedbackNotificationBell";
// Emergency and Announcement management - will be used when UI sections are added
// import {
//   fetchEmergencies,
//   acknowledgeEmergency,
//   resolveEmergency,
// } from "../../services/emergencyService";
// import {
//   fetchAdminAnnouncements,
//   createAnnouncement,
//   updateAnnouncement,
//   deleteAnnouncement,
// } from "../../services/announcementService";
import "../../styles/dashboard.css";
import "../../styles/admin-dashboard.css";

export default function AdminDashboard() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]); // Store all drivers for filtering
  const [rides, setRides] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [allPassengers, setAllPassengers] = useState([]); // Store all passengers for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  // Emergency and Announcement state - ready for UI implementation
  // Uncomment when adding the UI sections (see REMAINING_FRONTEND_WORK.md)
  // const [emergencies, setEmergencies] = useState([]);
  // const [announcements, setAnnouncements] = useState([]);
  // const [showEmergencies, setShowEmergencies] = useState(false);
  // const [showAnnouncements, setShowAnnouncements] = useState(false);
  // const [emergencyFilters, setEmergencyFilters] = useState({ status: "pending" });
  // const [announcementForm, setAnnouncementForm] = useState(null);

  console.log("[AdminDashboard] Component rendered", { token: !!token, user });

  const loadStats = useCallback(async () => {
    try {
      console.log("[AdminDashboard] Loading stats...");
      const response = await fetchAdminDashboard(token);
      console.log("[AdminDashboard] Raw response:", response);
      
      // Handle different response formats
      // Option 1: Direct stats object { passengers: 1, drivers: 1, ... }
      // Option 2: Wrapped in data key { data: { passengers: 1, drivers: 1, ... } }
      // Option 3: Stats nested { stats: { passengers: 1, drivers: 1, ... } }
      const statsData = response?.data || response?.stats || response || {};
      
      console.log("[AdminDashboard] Parsed stats:", statsData);
      console.log("[AdminDashboard] Stats values:", {
        passengers: statsData.passengers,
        drivers: statsData.drivers,
        active_rides: statsData.active_rides,
        today_revenue: statsData.today_revenue,
      });
      
      setStats(statsData);
    } catch (err) {
      console.error("[AdminDashboard] Error loading stats:", err);
      setError(
        err?.message || err?.data?.message || "Unable to load dashboard stats"
      );
      // Set empty stats on error so UI doesn't break
      setStats({ passengers: 0, drivers: 0, active_rides: 0, today_revenue: 0 });
    }
  }, [token]);

  const loadDrivers = useCallback(async () => {
    try {
      console.log("[AdminDashboard] Loading drivers...");
      const data = await fetchAdminDrivers(token);
      console.log("[AdminDashboard] Drivers loaded:", data);
      const driversList = Array.isArray(data) ? data : data?.data || [];
      setAllDrivers(driversList);
      setDrivers(driversList);
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

  const loadPassengers = useCallback(async () => {
    try {
      console.log("[AdminDashboard] Loading passengers...");
      // Since /api/admin/passengers doesn't exist, extract unique passengers from rides
      const ridesData = await fetchAdminRides(token);
      const rides = Array.isArray(ridesData) ? ridesData : ridesData?.data || [];
      
      // Extract unique passengers from rides
      const passengerMap = new Map();
      rides.forEach((ride) => {
        if (ride.passenger) {
          const passengerId = ride.passenger.id || ride.passenger.user_id || ride.passenger_id;
          if (passengerId && !passengerMap.has(passengerId)) {
            passengerMap.set(passengerId, {
              id: passengerId,
              user_id: passengerId,
              name: ride.passenger.name,
              email: ride.passenger.email,
              created_at: ride.passenger.created_at || ride.created_at,
              user: ride.passenger.user || {
                name: ride.passenger.name,
                email: ride.passenger.email,
                created_at: ride.passenger.created_at || ride.created_at,
              },
            });
          }
        }
      });
      
      const uniquePassengers = Array.from(passengerMap.values());
      console.log("[AdminDashboard] Passengers extracted from rides:", uniquePassengers);
      setAllPassengers(uniquePassengers);
      setPassengers(uniquePassengers);
    } catch (err) {
      console.error("[AdminDashboard] Error loading passengers:", err);
      setError(err?.message || err?.data?.message || "Unable to load passengers from rides");
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

  // Filter drivers and passengers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDrivers(allDrivers);
      setPassengers(allPassengers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Filter drivers
    const filteredDrivers = allDrivers.filter((driver) => {
      const name = (driver.name || driver.user?.name || "").toLowerCase();
      const email = (driver.email || driver.user?.email || "").toLowerCase();
      const phone = (driver.phone || driver.user?.phone || "").toLowerCase();
      const vehicle = (driver.vehicle_type || 
        (driver.vehicle_make && driver.vehicle_model
          ? `${driver.vehicle_make} ${driver.vehicle_model}`
          : "") || "").toLowerCase();
      const plate = (driver.plate_number || driver.license_plate || "").toLowerCase();
      const id = String(driver.id || "").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        vehicle.includes(query) ||
        plate.includes(query) ||
        id.includes(query)
      );
    });

    // Filter passengers
    const filteredPassengers = allPassengers.filter((passenger) => {
      const name = (passenger.name || passenger.user?.name || "").toLowerCase();
      const email = (passenger.email || passenger.user?.email || "").toLowerCase();
      const phone = (passenger.phone || passenger.user?.phone || "").toLowerCase();
      const id = String(passenger.id || passenger.user_id || "").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        id.includes(query)
      );
    });

    setDrivers(filteredDrivers);
    setPassengers(filteredPassengers);
  }, [searchQuery, allDrivers, allPassengers]);

  const handleDriverStatus = async (driverId, status) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateDriverStatus(token, driverId, status);
      // Reload drivers and stats to show updated status and counts
      await Promise.all([loadDrivers(), loadStats()]);
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
    <div className="dashboard admin-dashboard">
      <header className="dashboard__header" style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto 1fr",
        gap: "1rem",
        alignItems: "center"
      }}>
        <div>
          <h2>Admin Dashboard</h2>
          <p>Operational overview</p>
          {user && <p>Welcome, {user.name || user.email}</p>}
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          minWidth: "400px",
          maxWidth: "700px",
          width: "100%",
          position: "relative"
        }}>
          <div style={{ position: "relative", flex: 1, width: "100%" }}>
            {/* Search Icon */}
            <svg
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "20px",
                height: "20px",
                color: "var(--text-secondary)",
                pointerEvents: "none",
                zIndex: 1,
              }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search drivers and passengers by name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "1rem 1rem 1rem 3rem",
                paddingRight: searchQuery ? "3rem" : "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--card-border)",
                fontSize: "1rem",
                fontFamily: "inherit",
                outline: "none",
                transition: "var(--transition)",
                backgroundColor: "var(--card-bg)",
                color: "var(--text-primary)",
                fontWeight: "400",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent-primary)";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--card-border)";
                e.target.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "var(--text-primary)";
                  e.target.style.backgroundColor = "var(--card-border)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "var(--text-secondary)";
                  e.target.style.backgroundColor = "transparent";
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <div style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
              padding: "0.5rem 0",
              fontWeight: "500",
            }}>
              {drivers.length + passengers.length} result{drivers.length + passengers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ 
          display: "flex", 
          gap: "0.75rem", 
          alignItems: "center",
          justifyContent: "flex-end"
        }}>
          <FeedbackNotificationBell token={token} />
          <button 
            onClick={() => navigate("/admin/statistics")} 
            className="secondary"
          >
            Statistics
          </button>
          <button 
            onClick={() => navigate("/admin/feedbacks")} 
            className="secondary"
          >
            Feedbacks
          </button>
          <button 
            onClick={() => navigate("/admin/trip-history")} 
            className="secondary"
          >
            History
          </button>
          <button 
            onClick={() => navigate("/admin/accounts")} 
            className="secondary"
          >
            Accounts
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "1.5rem",
        alignItems: "start"
      }}>
        {/* Driver Registration Requests - Left Side */}
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

        {/* All Rides Monitor - Right Side */}
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
          {rides.map((ride) => (
            <div className="queue__item" key={ride.id}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                  <h4 style={{ margin: 0 }}>Ride #{ride.id}</h4>
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
                </div>
                <div className="details" style={{ marginTop: "0.5rem" }}>
                  <div>
                    <dt>Passenger</dt>
                    <dd>
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
                    </dd>
                  </div>
                  <div>
                    <dt>Route</dt>
                    <dd>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong>From:</strong>{" "}
                        {ride.pickup_place?.name ||
                          ride.pickup_address ||
                          (ride.pickup_lat && ride.pickup_lng
                            ? "Coordinates"
                            : "Not provided")}
                      </div>
                      <div>
                        <strong>To:</strong>{" "}
                        {ride.dropoff_place?.name ||
                          ride.dropoff_address ||
                          (ride.drop_lat && ride.drop_lng ? "Coordinates" : "Not provided")}
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt>Driver & Date</dt>
                    <dd>
                      <div style={{ marginBottom: "0.5rem" }}>
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
                      </div>
                      <div>
                        {ride.created_at
                          ? new Date(ride.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

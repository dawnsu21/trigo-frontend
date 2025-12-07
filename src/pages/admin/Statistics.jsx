import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminDashboard,
  fetchAdminDrivers,
  fetchAdminRides,
} from "../../services/adminService";
import "../../styles/dashboard.css";
import "../../styles/admin-dashboard.css";

export default function Statistics() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetchAdminDashboard(token);
      const statsData = response?.data || response?.stats || response || {};
      setStats(statsData);
    } catch (err) {
      console.error("[Statistics] Error loading stats:", err);
      setError(
        err?.message || err?.data?.message || "Unable to load statistics"
      );
      setStats({ passengers: 0, drivers: 0, active_rides: 0, today_revenue: 0 });
    }
  }, [token]);

  const loadDrivers = useCallback(async () => {
    try {
      const data = await fetchAdminDrivers(token);
      const driversList = Array.isArray(data) ? data : data?.data || [];
      setDrivers(driversList);
    } catch (err) {
      console.error("[Statistics] Error loading drivers:", err);
      setError(err?.message || err?.data?.message || "Unable to load drivers");
    }
  }, [token]);

  const loadPassengers = useCallback(async () => {
    try {
      // Extract unique passengers from rides (since /api/admin/passengers doesn't exist)
      const ridesData = await fetchAdminRides(token);
      const rides = Array.isArray(ridesData) ? ridesData : ridesData?.data || [];
      
      const passengerMap = new Map();
      rides.forEach((ride) => {
        if (ride.passenger) {
          const passengerId = ride.passenger.id || ride.passenger.user_id || ride.passenger_id;
          if (passengerId && !passengerMap.has(passengerId)) {
            passengerMap.set(passengerId, {
              id: passengerId,
              name: ride.passenger.name,
              email: ride.passenger.email,
            });
          }
        }
      });
      
      const uniquePassengers = Array.from(passengerMap.values());
      setPassengers(uniquePassengers);
    } catch (err) {
      console.error("[Statistics] Error loading passengers:", err);
      setError(err?.message || err?.data?.message || "Unable to load passengers");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError("");
      Promise.all([loadStats(), loadDrivers(), loadPassengers()])
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          console.error("[Statistics] Error loading data:", err);
          setLoading(false);
        });
    }
  }, [token, loadStats, loadDrivers, loadPassengers]);

  if (!token) {
    return (
      <div className="dashboard">
        <div className="alert alert--error">
          Not authenticated. Please log in.
        </div>
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
          <h2>Statistics</h2>
          <p>Account statistics overview</p>
        </div>
        <div style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "flex-end"
        }}>
          <button onClick={() => navigate("/admin/dashboard")} className="secondary">
            Back to Dashboard
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      {loading && (
        <div className="panel">
          <div className="panel__empty">
            <p>Loading statistics...</p>
          </div>
        </div>
      )}

      {!loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          marginTop: "1.5rem"
        }}>
          {/* Driver Accounts Statistics */}
          <section className="panel" style={{
            borderLeft: '5px solid #f97316',
            background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)'
          }}>
            <div className="panel__header">
              <div>
                <h3>Driver Accounts</h3>
                <p className="panel__description">
                  Total number of registered drivers
                </p>
              </div>
            </div>
            <div style={{
              padding: "2rem",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "4rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "0.5rem"
              }}>
                {drivers.length}
              </div>
              <p style={{
                color: "#64748b",
                fontSize: "1rem",
                margin: 0
              }}>
                Registered Drivers
              </p>
              {stats && (
                <p style={{
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                  marginTop: "0.5rem",
                  margin: "0.5rem 0 0 0"
                }}>
                  Dashboard shows: {stats.drivers || 0}
                </p>
              )}
            </div>
          </section>

          {/* Passenger Accounts Statistics */}
          <section className="panel" style={{
            borderLeft: '5px solid #ec4899',
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)'
          }}>
            <div className="panel__header">
              <div>
                <h3>Passenger Accounts</h3>
                <p className="panel__description">
                  Total number of registered passengers
                </p>
              </div>
            </div>
            <div style={{
              padding: "2rem",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "4rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #db2777 0%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "0.5rem"
              }}>
                {passengers.length}
              </div>
              <p style={{
                color: "#64748b",
                fontSize: "1rem",
                margin: 0
              }}>
                Registered Passengers
              </p>
              {stats && (
                <p style={{
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                  marginTop: "0.5rem",
                  margin: "0.5rem 0 0 0"
                }}>
                  Dashboard shows: {stats.passengers || 0}
                </p>
              )}
            </div>
          </section>

          {/* Additional Statistics */}
          {stats && (
            <>
              <section className="panel" style={{
                borderLeft: '5px solid #8b5cf6',
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)'
              }}>
                <div className="panel__header">
                  <div>
                    <h3>Active Rides</h3>
                    <p className="panel__description">
                      Currently active rides
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: "2rem",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontSize: "4rem",
                    fontWeight: "700",
                    background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: "0.5rem"
                  }}>
                    {stats.active_rides || 0}
                  </div>
                  <p style={{
                    color: "#64748b",
                    fontSize: "1rem",
                    margin: 0
                  }}>
                    Active Rides
                  </p>
                </div>
              </section>

              <section className="panel" style={{
                borderLeft: '5px solid #06b6d4',
                background: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)'
              }}>
                <div className="panel__header">
                  <div>
                    <h3>Today's Revenue</h3>
                    <p className="panel__description">
                      Revenue generated today
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: "2rem",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontSize: "4rem",
                    fontWeight: "700",
                    background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: "0.5rem"
                  }}>
                    ₱{stats.today_revenue ? parseFloat(stats.today_revenue).toFixed(2) : "0.00"}
                  </div>
                  <p style={{
                    color: "#64748b",
                    fontSize: "1rem",
                    margin: 0
                  }}>
                    Today's Revenue
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}


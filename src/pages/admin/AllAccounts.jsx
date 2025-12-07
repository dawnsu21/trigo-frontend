import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchAdminDrivers,
  fetchAdminRides,
} from "../../services/adminService";
import "../../styles/dashboard.css";
import "../../styles/admin-dashboard.css";

// Inline styles for responsive grid
const accountsGridStyle = `
  .accounts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }
  @media (max-width: 1200px) {
    .accounts-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default function AllAccounts() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]); // Store all drivers for filtering
  const [allPassengers, setAllPassengers] = useState([]); // Store all passengers for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDrivers = useCallback(async () => {
    try {
      console.log("[AllAccounts] Loading drivers...");
      const data = await fetchAdminDrivers(token);
      console.log("[AllAccounts] Drivers loaded:", data);
      const driversList = Array.isArray(data) ? data : data?.data || [];
      setAllDrivers(driversList);
      setDrivers(driversList);
    } catch (err) {
      console.error("[AllAccounts] Error loading drivers:", err);
      setError(err?.message || err?.data?.message || "Unable to load drivers");
    }
  }, [token]);

  const loadPassengers = useCallback(async () => {
    try {
      console.log("[AllAccounts] Loading passengers...");
      // Extract unique passengers from rides
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
              phone: ride.passenger.phone,
              created_at: ride.passenger.created_at || ride.created_at,
              user: ride.passenger.user || {
                name: ride.passenger.name,
                email: ride.passenger.email,
                phone: ride.passenger.phone,
                created_at: ride.passenger.created_at || ride.created_at,
              },
            });
          }
        }
      });
      
      const uniquePassengers = Array.from(passengerMap.values());
      console.log("[AllAccounts] Passengers extracted from rides:", uniquePassengers);
      setAllPassengers(uniquePassengers);
      setPassengers(uniquePassengers);
    } catch (err) {
      console.error("[AllAccounts] Error loading passengers:", err);
      setError(err?.message || err?.data?.message || "Unable to load passengers");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError("");
      Promise.all([loadDrivers(), loadPassengers()])
        .then(() => {
          console.log("[AllAccounts] All data loaded successfully");
          setLoading(false);
        })
        .catch((err) => {
          console.error("[AllAccounts] Error loading data:", err);
          setLoading(false);
        });
    } else {
      console.warn("[AllAccounts] No token available");
      setLoading(false);
    }
  }, [token, loadDrivers, loadPassengers]);

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
            <h2>All Accounts</h2>
            <p>Loading...</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={() => navigate("/admin/dashboard")} className="secondary">
              Back to Dashboard
            </button>
            <button onClick={logout} className="secondary">
              Logout
            </button>
          </div>
        </header>
        <div className="alert">Loading accounts data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      <style>{accountsGridStyle}</style>
      <header className="dashboard__header" style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto 1fr",
        gap: "1rem",
        alignItems: "center"
      }}>
        <div>
          <h2>All Accounts</h2>
          <p>View all driver and passenger accounts</p>
          {user && <p>Welcome, {user.name || user.email}</p>}
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          minWidth: "300px",
          maxWidth: "500px",
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
              placeholder="Search drivers and passengers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 3rem",
                paddingRight: searchQuery ? "2.5rem" : "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--card-border)",
                fontSize: "0.9375rem",
                fontFamily: "inherit",
                outline: "none",
                transition: "var(--transition)",
                backgroundColor: "var(--card-bg)",
                color: "var(--text-primary)",
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
                  right: "0.5rem",
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
                  fontSize: "1.25rem",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "var(--text-secondary)";
                }}
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
              padding: "0.5rem 0"
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
          <button onClick={() => navigate("/admin/dashboard")} className="secondary">
            Back to Dashboard
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Two Tables Side by Side */}
      <div 
        className="accounts-grid"
        style={{ 
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          alignItems: "start"
        }}
      >
        {/* Passenger Accounts Table - Left */}
        <section className="panel" style={{ margin: 0, borderLeft: '5px solid #8b5cf6', background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)' }}>
          <div className="panel__header">
            <div>
              <h3>👥 Passenger Accounts</h3>
              <p className="panel__description">
                All registered passenger accounts
              </p>
            </div>
            <button className="secondary" onClick={loadPassengers}>
              Refresh
            </button>
          </div>
          {passengers.length === 0 && (
            <div className="panel__empty">
              <p>No passenger accounts found.</p>
              <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Note: Only passengers who have booked at least one ride are shown here.
              </p>
            </div>
          )}
          {passengers.length > 0 && (
            <div className="table">
              <div className="table__head" style={{ gridTemplateColumns: "60px 1.2fr 1.5fr 1fr 1fr" }}>
                <span>ID</span>
                <span>Full Name</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Date Registered</span>
              </div>
              {passengers.map((passenger) => (
                <div 
                  className="table__row" 
                  key={passenger.id || passenger.user_id}
                  style={{ gridTemplateColumns: "60px 1.2fr 1.5fr 1fr 1fr" }}
                >
                  <span>
                    <strong>#{passenger.id || passenger.user_id || "N/A"}</strong>
                  </span>
                  <span>
                    <strong>{passenger.name || passenger.user?.name || "Unknown"}</strong>
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {passenger.email || passenger.user?.email || "Not provided"}
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {passenger.phone || passenger.user?.phone || "Not provided"}
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {passenger.created_at || passenger.user?.created_at
                      ? new Date(passenger.created_at || passenger.user?.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Driver Accounts Table - Right */}
        <section className="panel" style={{ margin: 0, borderLeft: '5px solid #f97316', background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' }}>
          <div className="panel__header">
              <div>
                <h3>🚕 Driver Accounts</h3>
                <p className="panel__description">
                  All registered driver accounts
                </p>
              </div>
            <button className="secondary" onClick={loadDrivers}>
              Refresh
            </button>
          </div>
          {drivers.length === 0 && (
            <div className="panel__empty">
              <p>No driver accounts found.</p>
            </div>
          )}
          {drivers.length > 0 && (
            <div className="table">
              <div className="table__head" style={{ gridTemplateColumns: "60px 1.2fr 1.3fr 1fr 1fr 1fr 100px" }}>
                <span>ID</span>
                <span>Full Name</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Vehicle</span>
                <span>Plate</span>
                <span>Status</span>
              </div>
              {drivers.map((driver) => (
                <div 
                  className="table__row" 
                  key={driver.id}
                  style={{ gridTemplateColumns: "60px 1.2fr 1.3fr 1fr 1fr 1fr 100px" }}
                >
                  <span>
                    <strong>#{driver.id}</strong>
                  </span>
                  <span>
                    <strong>{driver.name || driver.user?.name || "Unknown"}</strong>
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {driver.email || driver.user?.email || "Not provided"}
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {driver.phone || driver.user?.phone || "Not provided"}
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {driver.vehicle_type || 
                     (driver.vehicle_make && driver.vehicle_model
                       ? `${driver.vehicle_make} ${driver.vehicle_model}`
                       : "N/A")}
                  </span>
                  <span style={{ fontSize: "0.875rem" }}>
                    {driver.plate_number || driver.license_plate || "N/A"}
                  </span>
                  <span>
                    <span
                      className={`status status--${driver.status?.toLowerCase() || "pending"}`}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                    >
                      {driver.status === "pending" && "Pending"}
                      {driver.status === "approved" && "✓ Approved"}
                      {driver.status === "rejected" && "Rejected"}
                      {!["pending", "approved", "rejected"].includes(driver.status) && (driver.status || "Pending")}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


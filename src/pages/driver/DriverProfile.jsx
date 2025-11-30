import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchDriverProfile, fetchDriverHistory } from "../../services/driverService";
import "../../styles/dashboard.css";

export default function DriverProfile() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalEarnings: 0,
  });
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError("");
    try {
      // Fetch driver profile
      const profileResponse = await fetchDriverProfile(token);
      const profileData = profileResponse?.data || profileResponse;
      console.log("[DriverProfile] Profile loaded:", profileData);
      console.log("[DriverProfile] Current location details:", {
        has_current_place: !!profileData?.current_place,
        current_place_name: profileData?.current_place?.name,
        current_place_address: profileData?.current_place?.address,
        current_lat: profileData?.current_lat,
        current_lng: profileData?.current_lng,
        location_updated_at: profileData?.location_updated_at,
        has_coordinates: !!(profileData?.current_lat && profileData?.current_lng)
      });
      
      // Log if location data seems incomplete
      if (profileData?.current_lat && profileData?.current_lng && !profileData?.current_place) {
        console.warn("[DriverProfile] Location coordinates exist but current_place is missing. Backend may not be including the place relationship.");
      }
      
      setProfile(profileData);
      
      // Fetch ride history for stats
      try {
        const historyResponse = await fetchDriverHistory(token, 1);
        const rides = historyResponse?.data || historyResponse || [];
        setRecentRides(Array.isArray(rides) ? rides.slice(0, 5) : []);
        
        // Calculate stats
        const allRides = Array.isArray(rides) ? rides : [];
        const total = allRides.length;
        const completed = allRides.filter(r => r.status === 'completed').length;
        const cancelled = allRides.filter(r => r.status === 'cancelled').length;
        const earnings = allRides
          .filter(r => r.status === 'completed' && r.fare)
          .reduce((sum, r) => sum + parseFloat(r.fare || 0), 0);
        
        setStats({ 
          totalRides: total, 
          completedRides: completed, 
          cancelledRides: cancelled,
          totalEarnings: earnings
        });
      } catch (err) {
        console.warn("[DriverProfile] Could not load ride history:", err);
      }
    } catch (err) {
      console.error("[DriverProfile] Failed to load profile:", err);
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Load profile immediately when component mounts or when navigating to this page
    loadProfile();
    
    // Auto-refresh profile every 10 seconds to catch location updates faster
    const interval = setInterval(() => {
      console.log("[DriverProfile] Auto-refreshing profile...");
      loadProfile();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loadProfile]);
  
  // Refresh when page becomes visible (user switches back to this tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log("[DriverProfile] Page focused, refreshing profile...");
      loadProfile();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadProfile]);
  
  // Listen for storage events and custom events to detect when location is updated
  useEffect(() => {
    const handleStorageChange = (e) => {
      // If location was updated, refresh profile
      if (e.key === 'driver_location_updated') {
        console.log("[DriverProfile] Location update detected via storage, refreshing profile...");
        setTimeout(() => {
          loadProfile();
        }, 500); // Small delay to ensure backend has processed the update
        // Clear the flag
        localStorage.removeItem('driver_location_updated');
      }
    };
    
    // Also check for custom events (for same-tab updates)
    const handleLocationUpdate = () => {
      console.log("[DriverProfile] Location update event received, refreshing profile...");
      setTimeout(() => {
        loadProfile();
      }, 500); // Small delay to ensure backend has processed the update
    };
    
    // Listen for page visibility changes - refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("[DriverProfile] Page became visible, refreshing profile...");
        loadProfile();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('driverLocationUpdated', handleLocationUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check localStorage on mount in case update happened while page was open
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('driver_location_updated');
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate);
        const now = Date.now();
        // If update happened in the last 30 seconds, refresh
        if (now - updateTime < 30000) {
          console.log("[DriverProfile] Recent location update detected, refreshing profile...");
          loadProfile();
        }
        localStorage.removeItem('driver_location_updated');
      }
    };
    
    // Check immediately and then periodically
    checkForUpdates();
    const checkInterval = setInterval(checkForUpdates, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('driverLocationUpdated', handleLocationUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="dashboard">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>My Profile</h2>
          <p>View and manage your driver account</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="secondary" 
            onClick={loadProfile}
            disabled={loading}
            title="Refresh profile to see latest location updates"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button 
            className="secondary" 
            onClick={() => navigate('/driver/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <button onClick={logout} className="secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="dashboard__grid">
        {/* Personal Information */}
        <article className="panel">
          <h3>👤 Personal Information</h3>
          <dl className="details">
            <div>
              <dt>Full Name</dt>
              <dd>{user?.name || profile?.user?.name || "Not set"}</dd>
            </div>
            <div>
              <dt>Email Address</dt>
              <dd>{user?.email || profile?.user?.email || "Not set"}</dd>
            </div>
            <div>
              <dt>Phone Number</dt>
              <dd>{user?.phone || profile?.user?.phone || "Not set"}</dd>
            </div>
            <div>
              <dt>Account Type</dt>
              <dd>
                <span className="status status--pending" style={{ textTransform: 'capitalize' }}>
                  Driver
                </span>
              </dd>
            </div>
            {profile?.created_at && (
              <div>
                <dt>Member Since</dt>
                <dd>{new Date(profile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</dd>
              </div>
            )}
          </dl>
        </article>

        {/* Driver Status */}
        <article className="panel">
          <h3>🚗 Driver Status</h3>
          <dl className="details">
            <div>
              <dt>Approval Status</dt>
              <dd>
                <span 
                  className={`status status--${profile?.status === 'approved' ? 'completed' : profile?.status === 'rejected' ? 'cancelled' : 'pending'}`}
                >
                  {profile?.status === 'approved' && '✅ Approved'}
                  {profile?.status === 'pending' && '⏳ Pending Approval'}
                  {profile?.status === 'rejected' && '❌ Rejected'}
                  {!profile?.status && 'Unknown'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Online Status</dt>
              <dd>
                <span className={profile?.is_online ? "text-success" : "text-muted"}>
                  {profile?.is_online ? "🟢 Online" : "🔴 Offline"}
                </span>
              </dd>
            </div>
            <div>
              <dt>Current Location</dt>
              <dd>
                {profile?.current_place || (profile?.current_lat && profile?.current_lng) ? (
                  <div>
                    {profile.current_place ? (
                      <>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                            📍 {profile.current_place.name}
                          </strong>
                        </div>
                        {profile.current_place.address && (
                          <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                            {profile.current_place.address}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                          📍 Location Set (Coordinates Only)
                        </strong>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Place name not available, but coordinates are set
                        </div>
                      </div>
                    )}
                    {(profile.current_lat && profile.current_lng) && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        color: '#0369a1'
                      }}>
                        Coordinates: {parseFloat(profile.current_lat).toFixed(6)}, {parseFloat(profile.current_lng).toFixed(6)}
                      </div>
                    )}
                    {profile.location_updated_at && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontStyle: 'italic'
                      }}>
                        Last updated: {new Date(profile.location_updated_at).toLocaleString()}
                      </div>
                    )}
                    {!profile.location_updated_at && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontStyle: 'italic'
                      }}>
                        Location not updated yet
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    color: '#991b1b',
                    fontSize: '0.875rem'
                  }}>
                    <strong>⚠️ No location set</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                      Update your location in the dashboard so passengers can find you.
                    </p>
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </article>

        {/* Vehicle Information */}
        <article className="panel">
          <h3>🚙 Vehicle Information</h3>
          <dl className="details">
            {profile?.vehicle_type && (
              <div>
                <dt>Vehicle Type</dt>
                <dd>{profile.vehicle_type}</dd>
              </div>
            )}
            {(profile?.vehicle_make || profile?.vehicle_model) && (
              <div>
                <dt>Make & Model</dt>
                <dd>
                  {profile.vehicle_make || ''} {profile.vehicle_model || ''}
                </dd>
              </div>
            )}
            {profile?.plate_number && (
              <div>
                <dt>Plate Number</dt>
                <dd style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '600' }}>
                  {profile.plate_number}
                </dd>
              </div>
            )}
            {profile?.license_number && (
              <div>
                <dt>License Number</dt>
                <dd>{profile.license_number}</dd>
              </div>
            )}
          </dl>
        </article>

        {/* Statistics */}
        <article className="panel">
          <h3>📊 Ride Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #3b82f6', 
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.totalRides}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                Total Rides
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #10b981', 
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {stats.completedRides}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                Completed
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #ef4444', 
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                {stats.cancelledRides}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                Cancelled
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fef3c7', 
              border: '1px solid #f59e0b', 
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>
                ₱{stats.totalEarnings.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                Total Earnings
              </div>
            </div>
          </div>
        </article>

        {/* Recent Rides */}
        {recentRides.length > 0 && (
          <article className="panel">
            <div className="panel__header">
              <div>
                <h3>📋 Recent Rides</h3>
                <p className="panel__description">Your last 5 completed rides</p>
              </div>
              <button 
                className="secondary" 
                onClick={() => navigate('/driver/dashboard')}
              >
                View All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentRides.map((ride) => (
                <div 
                  key={ride.id} 
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '0.5rem',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <strong>Ride #{ride.id}</strong>
                      <span 
                        className={`status status--${ride.status?.toLowerCase().replace("_", "-")}`}
                        style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}
                      >
                        {ride.status === 'completed' && 'Completed'}
                        {ride.status === 'cancelled' && 'Cancelled'}
                        {ride.status === 'pending' && 'Pending'}
                        {ride.status === 'accepted' && 'Accepted'}
                        {ride.status === 'picked_up' && 'In Progress'}
                        {!['completed', 'cancelled', 'pending', 'accepted', 'picked_up'].includes(ride.status) && ride.status}
                      </span>
                    </div>
                    {ride.fare && (
                      <div style={{ fontWeight: 'bold', color: '#059669' }}>
                        ₱{parseFloat(ride.fare).toFixed(2)}
                      </div>
                    )}
                  </div>
                  {ride.passenger && (
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Passenger: <strong>{ride.passenger.name}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {ride.pickup_place?.name || ride.pickup_address} → {ride.dropoff_place?.name || ride.dropoff_address}
                  </div>
                  {ride.created_at && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      {new Date(ride.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}


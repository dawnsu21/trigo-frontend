import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../services/apiClient";
import { fetchPassengerHistory } from "../../services/passengerService";
import "../../styles/dashboard.css";

export default function PassengerProfile() {
  const { token, user, logout, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
  });
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError("");
    try {
      // Fetch current user data
      const userData = await fetchMe();
      setProfile(userData);
      
      // Fetch ride history for stats
      try {
        const historyResponse = await fetchPassengerHistory(token, 1);
        const rides = historyResponse?.data || historyResponse || [];
        setRecentRides(Array.isArray(rides) ? rides.slice(0, 5) : []);
        
        // Calculate stats
        const total = Array.isArray(rides) ? rides.length : 0;
        const completed = Array.isArray(rides) 
          ? rides.filter(r => r.status === 'completed').length 
          : 0;
        const cancelled = Array.isArray(rides) 
          ? rides.filter(r => r.status === 'cancelled').length 
          : 0;
        
        setStats({ totalRides: total, completedRides: completed, cancelledRides: cancelled });
      } catch (err) {
        console.warn("[PassengerProfile] Could not load ride history:", err);
      }
    } catch (err) {
      console.error("[PassengerProfile] Failed to load profile:", err);
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [token, fetchMe]);

  useEffect(() => {
    loadProfile();
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
          <p>View and manage your account information</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="secondary" 
            onClick={() => navigate('/passenger/dashboard')}
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
              <dd>{profile?.name || user?.name || "Not set"}</dd>
            </div>
            <div>
              <dt>Email Address</dt>
              <dd>{profile?.email || user?.email || "Not set"}</dd>
            </div>
            <div>
              <dt>Phone Number</dt>
              <dd>{profile?.phone || user?.phone || "Not set"}</dd>
            </div>
            <div>
              <dt>Account Type</dt>
              <dd>
                <span className="status status--pending" style={{ textTransform: 'capitalize' }}>
                  Passenger
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

        {/* Ride Statistics */}
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
          </div>
        </article>

        {/* Recent Rides */}
        {recentRides.length > 0 && (
          <article className="panel">
            <div className="panel__header">
              <div>
                <h3>📋 Recent Rides</h3>
                <p className="panel__description">Your last 5 ride bookings</p>
              </div>
              <button 
                className="secondary" 
                onClick={() => navigate('/passenger/dashboard')}
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


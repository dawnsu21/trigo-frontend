import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { navigateToDashboard } from "../utils/navigation";
import "./landing.css";

const defaultForm = { email: "", password: "" };

export default function LandingPage() {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (isAuthenticated && role) {
      navigateToDashboard(role, navigate);
    }
  }, [isAuthenticated, role, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      // Navigate to appropriate dashboard based on user role
      navigateToDashboard(data?.role, navigate);
    } catch (err) {
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        err?.data?.error ||
        "Unable to sign in. Please check your credentials.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing">
      <section className="landing__hero">
        <h1>RidePilot Portal</h1>
        <p>Log in to continue.</p>
      </section>

      <section className="landing__auth">
        <form className="landing__form" onSubmit={handleSubmit}>
          <h2>Account Login</h2>
          {error && <div className="alert alert--error">{error}</div>}

          <label>
            Email
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="landing__cta">
          <p>Need an account?</p>
          <div className="landing__actions">
            <Link to="/passenger/signup">Passenger Registration</Link>
            <Link to="/driver/signup">Driver Registration</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { navigateToDashboard } from "../../utils/navigation";
import "../../styles/forms.css";

const initialForm = { email: "", password: "" };

export default function AdminLogin() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
      // Extract more detailed error message
      const errorMessage =
        err?.data?.errors?.email?.[0] ||
        err?.data?.errors?.password?.[0] ||
        err?.data?.message ||
        err?.message ||
        err?.data?.error ||
        "Unable to sign in. Please check your email and password.";
      setError(errorMessage);
      
      // Log full error details for debugging
      console.error("Login error details:", {
        message: err?.message,
        status: err?.status,
        data: err?.data,
        errors: err?.data?.errors,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <h2>Admin Login</h2>
      <p>Use the seeded admin credentials to continue.</p>
      {error && <div className="alert alert--error">{error}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </section>
  );
}

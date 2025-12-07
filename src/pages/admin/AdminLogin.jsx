import { useState, useEffect } from "react";
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
  const { login, isAuthenticated, role } = useAuth();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && role) {
      const roleLower = role.toLowerCase();
      console.log("[AdminLogin] Already authenticated, role:", roleLower);
      if (roleLower === 'admin') {
        console.log("[AdminLogin] Redirecting to admin dashboard...");
        navigate('/admin/dashboard', { replace: true });
      }
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
      console.log("[AdminLogin] Attempting login...");
      const data = await login(form);
      console.log("[AdminLogin] Login response:", data);
      console.log("[AdminLogin] Role from response:", data?.role);
      
      // Get role from multiple possible sources
      const role = data?.role || data?.user?.role || data?.roles?.[0] || "";
      console.log("[AdminLogin] Extracted role:", role);
      
      if (!role) {
        console.error("[AdminLogin] No role found in response:", data);
        setError("Login successful but role not found. Please contact support.");
        setLoading(false);
        return;
      }
      
      // Normalize role to lowercase
      const normalizedRole = role.toLowerCase();
      console.log("[AdminLogin] Normalized role:", normalizedRole);
      
      if (normalizedRole !== 'admin') {
        console.warn("[AdminLogin] User role is not admin:", normalizedRole);
        setError(`Access denied. This account has role: ${role}. Admin access required.`);
        setLoading(false);
        return;
      }
      
      // Small delay to ensure auth context is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Double-check role from auth context (already available from hook at top level)
      console.log("[AdminLogin] Role from context after login:", role);
      
      // Navigate to admin dashboard
      console.log("[AdminLogin] Navigating to admin dashboard...");
      navigate('/admin/dashboard', { replace: true });
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
      console.error("[AdminLogin] Login error details:", {
        message: err?.message,
        status: err?.status,
        data: err?.data,
        errors: err?.data?.errors,
        fullError: err,
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

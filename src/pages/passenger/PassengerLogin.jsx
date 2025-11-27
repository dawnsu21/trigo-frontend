import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { navigateToDashboard } from '../../utils/navigation'
import '../../styles/forms.css'

const initialForm = { email: '', password: '' }

export default function PassengerLogin() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form)
      // Navigate to appropriate dashboard based on user role
      navigateToDashboard(data?.role, navigate)
    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || err?.data?.error || 'Invalid credentials. Please check your email and password.'
      setError(errorMessage)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-card">
      <h2>Passenger Login</h2>
      <p>Sign in to book and manage rides.</p>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="form__footer">
        Need an account? <Link to="/passenger/signup">Create one</Link>
      </p>
    </section>
  )
}


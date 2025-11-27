import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './landing.css'

const defaultForm = { email: '', password: '' }

export default function LandingPage() {
  const [form, setForm] = useState(defaultForm)
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
      const userRole = data?.role || data?.user?.role || data?.user?.roles?.[0]?.name
      const destination = {
        passenger: '/passenger/dashboard',
        driver: '/driver/dashboard',
        admin: '/admin/dashboard',
      }[userRole] || '/'
      navigate(destination)
    } catch (err) {
      setError(err?.data?.message || 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

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
            <input name="email" type="email" required value={form.email} onChange={handleChange} />
          </label>

          <label>
            Password
            <input name="password" type="password" required value={form.password} onChange={handleChange} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
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
  )
}


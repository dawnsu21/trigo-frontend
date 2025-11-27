import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/forms.css'

const initialValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
}

export default function PassengerSignup() {
  const [form, setForm] = useState(initialValues)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { registerPassenger } = useAuth()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setSubmitting(true)
    try {
      await registerPassenger(form)
      setStatus({ type: 'success', message: 'Account created. Please sign in.' })
      setTimeout(() => navigate('/passenger/login'), 1000)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error?.data?.message || 'Unable to create passenger account',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-card">
      <h2>Passenger Sign Up</h2>
      <p>Create an account to book rides.</p>

      {status.message && (
        <div className={`alert alert--${status.type}`}>
          {status.message}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </label>

        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            name="password_confirmation"
            value={form.password_confirmation}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      <p className="form__footer">
        Already have an account? <Link to="/passenger/login">Sign in</Link>
      </p>
    </section>
  )
}


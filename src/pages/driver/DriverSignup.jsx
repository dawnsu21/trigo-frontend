import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/forms.css'

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  vehicle_make: '',
  vehicle_model: '',
  vehicle_plate: '',
  license_number: '',
}

export default function DriverSignup() {
  const [form, setForm] = useState(defaultForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { registerDriver } = useAuth()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus({ type: '', message: '' })
    try {
      await registerDriver(form)
      setStatus({ type: 'success', message: 'Driver profile submitted. Await approval.' })
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setStatus({
        type: 'error',
        message: err?.data?.message || 'Unable to complete registration',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-card">
      <h2>Driver Sign Up</h2>
      <p>Provide your vehicle details to start driving.</p>

      {status.message && (
        <div className={`alert alert--${status.type}`}>{status.message}</div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input name="name" required value={form.name} onChange={handleChange} />
        </label>

        <label>
          Email
          <input type="email" name="email" required value={form.email} onChange={handleChange} />
        </label>

        <label>
          Phone
          <input name="phone" required value={form.phone} onChange={handleChange} />
        </label>

        <div className="form__grid">
          <label>
            Vehicle Make
            <input name="vehicle_make" required value={form.vehicle_make} onChange={handleChange} />
          </label>
          <label>
            Vehicle Model
            <input name="vehicle_model" required value={form.vehicle_model} onChange={handleChange} />
          </label>
        </div>

        <div className="form__grid">
          <label>
            License Plate
            <input name="vehicle_plate" required value={form.vehicle_plate} onChange={handleChange} />
          </label>
          <label>
            License Number
            <input name="license_number" required value={form.license_number} onChange={handleChange} />
          </label>
        </div>

        <label>
          Password
          <input type="password" name="password" required value={form.password} onChange={handleChange} />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            name="password_confirmation"
            required
            value={form.password_confirmation}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Create Driver Account'}
        </button>
      </form>
    </section>
  )
}


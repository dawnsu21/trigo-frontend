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
  license_plate: '',
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
    
    // Client-side validation
    if (form.password !== form.password_confirmation) {
      setStatus({
        type: 'error',
        message: 'Passwords do not match. Please check and try again.',
      })
      return
    }

    if (form.password.length < 8) {
      setStatus({
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      })
      return
    }

    setSubmitting(true)
    setStatus({ type: '', message: '' })
    
    try {
      console.log('[DriverSignup] Submitting registration...', form)
      const response = await registerDriver(form)
      console.log('[DriverSignup] Registration successful:', response)
      
      setStatus({ 
        type: 'success', 
        message: 'Driver registration submitted successfully! Your application is pending admin approval. You will be notified once approved.' 
      })
      
      // Clear form after successful submission
      setForm(defaultForm)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/driver/login')
      }, 3000)
    } catch (err) {
      console.error('[DriverSignup] Registration error:', err)
      
      // Handle validation errors - Laravel returns errors object
      let errorMessage = 'Unable to complete registration. Please check all fields and try again.'
      
      if (err?.data?.message) {
        errorMessage = err.data.message
      } else if (err?.data?.errors) {
        // Laravel validation errors format: { errors: { field: ["message"] } }
        const errorMessages = Object.values(err.data.errors).flat()
        errorMessage = errorMessages.join(', ') || errorMessage
      } else if (err?.message) {
        errorMessage = err.message
      } else if (err?.status === 0) {
        errorMessage = 'Network error: Could not connect to server. Please check your connection.'
      } else if (err?.status === 422) {
        errorMessage = 'Validation error: Please check all required fields are filled correctly.'
      } else if (err?.status === 500) {
        errorMessage = 'Server error: Please try again later or contact support.'
      }
      
      setStatus({
        type: 'error',
        message: errorMessage,
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
        <div className="form__section">
          <h4>Personal Information</h4>
          <label>
            Full Name
            <input 
              name="name" 
              required 
              value={form.name} 
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </label>

          <label>
            Email Address
            <input 
              type="email" 
              name="email" 
              required 
              value={form.email} 
              onChange={handleChange}
              placeholder="your.email@example.com"
            />
          </label>

          <label>
            Phone Number
            <input 
              name="phone" 
              required 
              value={form.phone} 
              onChange={handleChange}
              placeholder="09XX XXX XXXX"
            />
          </label>
        </div>

        <div className="form__section">
          <h4>Vehicle Information</h4>
          <div className="form__grid">
            <label>
              Vehicle Make
              <input 
                name="vehicle_make" 
                required 
                value={form.vehicle_make} 
                onChange={handleChange}
                placeholder="e.g., Honda, Yamaha"
              />
            </label>
            <label>
              Vehicle Model
              <input 
                name="vehicle_model" 
                required 
                value={form.vehicle_model} 
                onChange={handleChange}
                placeholder="e.g., TMX 155, Mio"
              />
            </label>
          </div>

          <div className="form__grid">
            <label>
              License Plate Number
              <input 
                name="license_plate" 
                required 
                value={form.license_plate} 
                onChange={handleChange}
                placeholder="e.g., ABC-1234"
              />
            </label>
            <label>
              Driver's License Number
              <input 
                name="license_number" 
                required 
                value={form.license_number} 
                onChange={handleChange}
                placeholder="Your driver's license number"
              />
            </label>
          </div>
        </div>

        <div className="form__section">
          <h4>Account Security</h4>
          <label>
            Password
            <input 
              type="password" 
              name="password" 
              required 
              value={form.password} 
              onChange={handleChange}
              placeholder="At least 8 characters"
              minLength={8}
            />
            <small>Password must be at least 8 characters long</small>
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="password_confirmation"
              required
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Re-enter your password"
              minLength={8}
            />
            <small>Re-enter your password to confirm</small>
          </label>
        </div>

        <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: '1rem' }}>
          {submitting ? 'Submitting Application...' : 'Submit Driver Application'}
        </button>
        
        {status.type === 'success' && (
          <p className="text-muted" style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            Redirecting to login page...
          </p>
        )}
      </form>
    </section>
  )
}


import { useState } from 'react'
import { submitFeedback } from '../services/feedbackService'
import './FeedbackForm.css'

export default function FeedbackForm({ token, rideId, driverName, onSuccess, onSkip }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setError('')
    setLoading(true)

    try {
      await submitFeedback(token, {
        ride_id: rideId,
        rating,
        comment: comment.trim() || undefined,
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="feedback-form">
      <h3>Rate Your Driver</h3>
      <p className="feedback-form__description">
        {driverName ? (
          <>How was your ride with <strong>{driverName}</strong>? Your feedback helps us improve our service.</>
        ) : (
          <>How was your ride? Your feedback helps us improve our service.</>
        )}
      </p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert--error">{error}</div>
        )}

        <div className="feedback-form__rating">
          <label>Rating *</label>
          <div className="feedback-form__stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`feedback-form__star ${
                  star <= (hoveredRating || rating) ? 'feedback-form__star--active' : ''
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                ⭐
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="feedback-form__rating-text">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        <label>
          Comment (Optional)
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            rows="4"
          />
        </label>

        <div className="feedback-form__actions">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="secondary"
              disabled={loading}
            >
              Skip
            </button>
          )}
          <button type="submit" disabled={loading || rating === 0}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  )
}


import { useState } from 'react';
import { createPortal } from 'react-dom';
import { submitFeedback } from '../services/feedbackService';
import './FeedbackForm.css';

export default function PassengerRatingModal({ token, rideId, passengerName, onSuccess, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await submitFeedback(token, {
        ride_id: rideId,
        rating,
        comment: comment.trim() || undefined,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleSkip();
        }
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#64748b',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f1f5f9';
            e.target.style.color = '#1e293b';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#64748b';
          }}
        >
          ×
        </button>

        <div className="feedback-form">
          <h3>Rate Your Passenger</h3>
          <p className="feedback-form__description">
            {passengerName ? (
              <>How was your experience with <strong>{passengerName}</strong>? Your feedback helps us improve our service.</>
            ) : (
              <>How was your experience with this passenger? Your feedback helps us improve our service.</>
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
              <button
                type="button"
                onClick={handleSkip}
                className="secondary"
                disabled={loading}
              >
                Skip
              </button>
              <button type="submit" disabled={loading || rating === 0}>
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}


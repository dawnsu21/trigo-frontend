import { useState, useEffect } from 'react'
import { fetchPlaces, searchPlaces } from '../services/placesService'

/**
 * PlaceSelector Component
 * Allows users to select pickup and dropoff locations from predefined places
 * 
 * This component will work once the backend Places API is implemented
 */
export default function PlaceSelector({ 
  name,
  label, 
  value, 
  onChange, 
  placeholder = "Search for a location in Bulan...",
  required = false 
}) {
  const [places, setPlaces] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState(null)

  useEffect(() => {
    loadPlaces()
  }, [])

  useEffect(() => {
    // Find selected place when value changes
    if (value && places.length > 0) {
      const place = places.find(p => p.id === value)
      setSelectedPlace(place || null)
    } else {
      setSelectedPlace(null)
    }
  }, [value, places])

  const loadPlaces = async () => {
    setLoading(true)
    try {
      const data = await fetchPlaces()
      setPlaces(Array.isArray(data) ? data : data?.data || [])
    } catch (error) {
      console.error('Failed to load places:', error)
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length > 0) {
      try {
        const results = await searchPlaces(query)
        setPlaces(Array.isArray(results) ? results : results?.data || [])
      } catch (error) {
        console.error('Search failed:', error)
      }
    } else {
      loadPlaces()
    }
  }

  const handleSelect = (place) => {
    setSelectedPlace(place)
    onChange({
      target: {
        name: name,
        value: place.id,
      }
    })
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    setSelectedPlace(null)
    onChange({
      target: {
        name: name,
        value: '',
      }
    })
    setIsOpen(true)
  }

  return (
    <div className="place-selector" style={{ position: 'relative' }}>
      <label>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      
      {selectedPlace && !isOpen ? (
        <div style={{ marginTop: '0.5rem' }}>
          <div 
            className="place-selector__selected"
            onClick={() => setIsOpen(true)}
            style={{
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              background: '#f8fafc',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
          >
            <strong>{selectedPlace.name}</strong>
            <br />
            <small style={{ color: '#64748b' }}>{selectedPlace.address}</small>
            {selectedPlace.category && (
              <span style={{ 
                display: 'inline-block',
                marginLeft: '0.5rem',
                padding: '0.125rem 0.5rem',
                background: '#e0e7ff',
                color: '#3730a3',
                borderRadius: '0.25rem',
                fontSize: '0.75rem'
              }}>
                {selectedPlace.category}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="secondary"
            style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}
          >
            Change Location
          </button>
        </div>
      ) : (
        <div className="place-selector__input-wrapper" style={{ position: 'relative', marginTop: '0.5rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholder}
            required={required}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
          
          {isOpen && (
            <div 
              className="place-selector__dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                marginTop: '0.25rem',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {loading && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                  Loading places...
                </div>
              )}
              
              {!loading && places.length === 0 && (
                <div style={{ padding: '1rem', color: '#64748b' }}>
                  {searchQuery ? 'No places found. Try a different search.' : 'Loading places...'}
                </div>
              )}
              
              {!loading && places.map((place) => (
                <div
                  key={place.id}
                  onClick={() => handleSelect(place)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <strong>{place.name}</strong>
                  <br />
                  <small style={{ color: '#64748b' }}>{place.address}</small>
                  {place.category && (
                    <span style={{ 
                      display: 'inline-block',
                      marginLeft: '0.5rem',
                      padding: '0.125rem 0.5rem',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}>
                      {place.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


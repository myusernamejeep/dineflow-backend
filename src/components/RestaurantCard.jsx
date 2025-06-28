import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function RestaurantCard({ restaurant, onBookNow }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleBookNow = (e) => {
    e.stopPropagation();
    if (onBookNow) {
      onBookNow(restaurant);
    }
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const getCuisineIcon = (cuisine) => {
    const icons = {
      'Thai': '🍜',
      'Japanese': '🍣',
      'Chinese': '🥢',
      'Italian': '🍝',
      'American': '🍔',
      'Mexican': '🌮',
      'Indian': '🍛',
      'Korean': '🍲',
      'French': '🥖',
      'default': '🍽️'
    };
    return icons[cuisine] || icons.default;
  };

  return (
    <div 
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #eee',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={() => setShowDetails(!showDetails)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
    >
      {/* Restaurant Image Placeholder */}
      <div style={{
        width: '100%',
        height: '150px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '3rem'
      }}>
        {getCuisineIcon(restaurant.cuisine)}
      </div>

      {/* Restaurant Info */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{
          fontSize: '1.3rem',
          color: '#2c3e50',
          margin: '0 0 8px 0',
          fontWeight: '600'
        }}>
          {restaurant.name}
        </h3>
        
        <p style={{
          color: '#7f8c8d',
          margin: '0 0 8px 0',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          📍 {restaurant.address}
        </p>
        
        <p style={{
          color: '#7f8c8d',
          margin: '0 0 8px 0',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          🍽️ {restaurant.cuisine || 'International'}
        </p>
        
        <p style={{
          color: '#7f8c8d',
          margin: '0',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          ⏰ {formatTime(restaurant.openingTime)} - {formatTime(restaurant.closingTime)}
        </p>
      </div>

      {/* Rating and Price */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{ color: '#f39c12', fontSize: '16px' }}>⭐</span>
          <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
            {restaurant.rating || '4.5'}
          </span>
        </div>
        
        <div style={{
          color: '#27ae60',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ${restaurant.priceRange || '$$'}
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleBookNow}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2980b9';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#3498db';
        }}
      >
        📅 Book Now
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div style={{
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '1px solid #eee'
        }}>
          <h4 style={{
            color: '#2c3e50',
            margin: '0 0 10px 0',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            About {restaurant.name}
          </h4>
          
          <p style={{
            color: '#7f8c8d',
            margin: '0 0 10px 0',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {restaurant.description || 'Experience delicious cuisine in a welcoming atmosphere. Perfect for any occasion.'}
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '13px'
          }}>
            <div>
              <strong style={{ color: '#2c3e50' }}>Capacity:</strong>
              <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                {restaurant.capacity || '50'} people
              </span>
            </div>
            <div>
              <strong style={{ color: '#2c3e50' }}>Tables:</strong>
              <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                {restaurant.numTables || '15'} tables
              </span>
            </div>
            <div>
              <strong style={{ color: '#2c3e50' }}>Phone:</strong>
              <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                {restaurant.phone || 'N/A'}
              </span>
            </div>
            <div>
              <strong style={{ color: '#2c3e50' }}>Website:</strong>
              <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                {restaurant.website ? 'Available' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { restaurantAPI, bookingAPI, apiUtils } from '../utils/api';
import BookingForm from '../components/BookingForm';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Booking() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!apiUtils.isAuthenticated()) {
        window.location.href = '/login';
        return;
      }

      // Load restaurants
      const restaurantsData = await restaurantAPI.getAll();
      setRestaurants(restaurantsData.restaurants || []);

      // Get restaurant ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const restaurantId = urlParams.get('restaurant');
      
      if (restaurantId) {
        const restaurant = restaurantsData.restaurants.find(r => r._id === restaurantId);
        if (restaurant) {
          setSelectedRestaurant(restaurant);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
        apiUtils.clearAuth();
        window.location.href = '/login';
      } else {
        setError('Failed to load restaurants. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('restaurant', restaurant._id);
    window.history.pushState({}, '', url);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      setLoading(true);
      
      const response = await bookingAPI.create({
        ...bookingData,
        restaurantId: selectedRestaurant._id
      });
      
      // Show success message and redirect
      alert('Booking created successfully! You will receive a confirmation via LINE and email.');
      window.location.href = '/profile';
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRestaurants = () => {
    setSelectedRestaurant(null);
    // Clear URL params
    const url = new URL(window.location);
    url.searchParams.delete('restaurant');
    window.history.pushState({}, '', url);
  };

  if (loading) {
    return <LoadingOverlay message="Loading..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button 
          onClick={loadData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            color: '#2c3e50', 
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            📅 Make a Booking
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#7f8c8d', 
            margin: '0' 
          }}>
            Select a restaurant and book your table
          </p>
        </div>
        
        <a 
          href="/" 
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        >
          ← Back to Home
        </a>
      </div>

      {/* Content */}
      {!selectedRestaurant ? (
        /* Restaurant Selection */
        <div>
          <h2 style={{ 
            fontSize: '2rem', 
            color: '#2c3e50', 
            marginBottom: '20px',
            fontWeight: '600'
          }}>
            Choose a Restaurant
          </h2>
          
          {restaurants.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: '#7f8c8d'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🍽️</div>
              <h3>No restaurants available</h3>
              <p>Check back later for new dining options!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {restaurants.map(restaurant => (
                <div 
                  key={restaurant._id}
                  onClick={() => handleRestaurantSelect(restaurant)}
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '20px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 8px 15px rgba(0,0,0,0.2)';
                    e.target.style.borderColor = '#3498db';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    e.target.style.borderColor = 'transparent';
                  }}
                >
                  {restaurant.imageUrl && (
                    <img 
                      src={restaurant.imageUrl} 
                      alt={restaurant.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        marginBottom: '15px'
                      }}
                    />
                  )}
                  
                  <h3 style={{ 
                    fontSize: '1.3rem', 
                    color: '#2c3e50', 
                    margin: '0 0 10px 0',
                    fontWeight: '600'
                  }}>
                    {restaurant.name}
                  </h3>
                  
                  <p style={{ 
                    color: '#7f8c8d', 
                    margin: '0 0 10px 0',
                    fontSize: '14px'
                  }}>
                    {restaurant.address}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      background: '#e8f5e8',
                      color: '#27ae60',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {restaurant.cuisine}
                    </span>
                    
                    <span style={{
                      background: '#fff3cd',
                      color: '#856404',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {restaurant.priceRange}
                    </span>
                  </div>
                  
                  <div style={{
                    marginTop: '15px',
                    textAlign: 'center'
                  }}>
                    <button style={{
                      padding: '8px 16px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Select Restaurant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Booking Form */
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <button 
              onClick={handleBackToRestaurants}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '15px'
              }}
            >
              ← Back to Restaurants
            </button>
            
            <div>
              <h2 style={{ 
                fontSize: '2rem', 
                color: '#2c3e50', 
                margin: '0 0 5px 0',
                fontWeight: '600'
              }}>
                Book at {selectedRestaurant.name}
              </h2>
              <p style={{ 
                color: '#7f8c8d', 
                margin: '0',
                fontSize: '1rem'
              }}>
                {selectedRestaurant.address}
              </p>
            </div>
          </div>
          
          <BookingForm 
            restaurant={selectedRestaurant}
            onSubmit={handleBookingSubmit}
          />
        </div>
      )}
    </div>
  );
}

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { restaurantAPI, authAPI, apiUtils } from '../utils/api';
import RestaurantList from '../components/RestaurantList';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [lineOAId, setLineOAId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load restaurants
      const restaurantsData = await restaurantAPI.getAll();
      setRestaurants(restaurantsData.restaurants || []);

      // Load LINE OA ID
      const lineData = await authAPI.getLineOAId();
      setLineOAId(lineData.lineOAId);

      // Check if user is authenticated
      if (apiUtils.isAuthenticated()) {
        try {
          const userData = await authAPI.getProfile();
          setUser(userData.user);
        } catch (error) {
          console.log('User not authenticated or token expired');
          apiUtils.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiUtils.clearAuth();
      setUser(null);
      window.location.href = '/';
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading restaurants..." />;
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
            🍽️ DineFlow
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#7f8c8d', 
            margin: '0' 
          }}>
            Discover and book your perfect dining experience
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: '#2c3e50' }}>
                Welcome, {user.displayName}!
              </span>
              <a 
                href="/profile" 
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                My Bookings
              </a>
              <button 
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <a 
              href="/login" 
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Login with LINE
            </a>
          )}
        </div>
      </div>

      {/* LINE OA Add Friend Box */}
      {user && lineOAId && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
              📱 Get Notifications via LINE
            </h3>
            <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
              Add our LINE Official Account to receive booking updates and notifications
            </p>
          </div>
          <a 
            href={`https://line.me/R/ti/p/${lineOAId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'white',
              color: '#667eea',
              padding: '8px 16px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Add Friend
          </a>
        </div>
      )}

      {/* Restaurants Section */}
      <div>
        <h2 style={{ 
          fontSize: '2rem', 
          color: '#2c3e50', 
          marginBottom: '20px',
          fontWeight: '600'
        }}>
          Available Restaurants
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
          <RestaurantList restaurants={restaurants} />
        )}
      </div>

      {/* Admin Link */}
      {user && user.isAdmin && (
        <div style={{ 
          marginTop: '40px', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
            Admin Panel
          </h3>
          <a 
            href="/admin" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#9b59b6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          >
            Manage Restaurants & Bookings
          </a>
        </div>
      )}
    </div>
  );
}

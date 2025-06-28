import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { adminAPI, restaurantAPI, authAPI, apiUtils } from '../utils/api';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import AdminDashboard from '../components/AdminDashboard';
import AdminRestaurantTable from '../components/AdminRestaurantTable';
import AdminBookingTable from '../components/AdminBookingTable';
import AdminAddRestaurantForm from '../components/AdminAddRestaurantForm';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!apiUtils.isAuthenticated()) {
        window.location.href = '/login';
        return;
      }

      // Load user profile to check admin status
      const userData = await authAPI.getProfile();
      setUser(userData.user);

      if (!userData.user.isAdmin) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      // Load dashboard stats
      const statsData = await adminAPI.getDashboardStats();
      setDashboardStats(statsData.stats);

      // Load restaurants
      const restaurantsData = await restaurantAPI.getAll();
      setRestaurants(restaurantsData.restaurants || []);

      // Load bookings
      const bookingsData = await adminAPI.getAllBookings();
      setBookings(bookingsData.bookings || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
        apiUtils.clearAuth();
        window.location.href = '/login';
      } else {
        setError('Failed to load admin data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (restaurantData) => {
    try {
      setLoading(true);
      await restaurantAPI.create(restaurantData);
      
      // Reload restaurants
      const restaurantsData = await restaurantAPI.getAll();
      setRestaurants(restaurantsData.restaurants || []);
      
      setShowAddRestaurant(false);
      alert('Restaurant added successfully!');
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('Failed to add restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      setLoading(true);
      await adminAPI.updateBookingStatus(bookingId, status);
      
      // Reload bookings
      const bookingsData = await adminAPI.getAllBookings();
      setBookings(bookingsData.bookings || []);
      
      alert('Booking status updated successfully!');
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) {
      return;
    }

    try {
      setLoading(true);
      await restaurantAPI.delete(restaurantId);
      
      // Reload restaurants
      const restaurantsData = await restaurantAPI.getAll();
      setRestaurants(restaurantsData.restaurants || []);
      
      alert('Restaurant deleted successfully!');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('Failed to delete restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = () => {
    loadAdminData();
  };

  if (loading) {
    return <LoadingOverlay message="Loading admin panel..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button 
          onClick={loadAdminData}
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

  if (!user || !user.isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red' }}>Access denied. Admin privileges required.</div>
        <a 
          href="/" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block',
            marginTop: '10px'
          }}
        >
          Go to Home
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
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
            🛠️ Admin Panel
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#7f8c8d', 
            margin: '0' 
          }}>
            Manage restaurants, bookings, and view analytics
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleRefreshData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
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
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '5px',
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
          { id: 'restaurants', label: '🍽️ Restaurants', icon: '🍽️' },
          { id: 'bookings', label: '📅 Bookings', icon: '📅' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === tab.id ? '#3498db' : '#f8f9fa',
              color: activeTab === tab.id ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <div>
          <h2 style={{ 
            fontSize: '2rem', 
            color: '#2c3e50', 
            marginBottom: '20px',
            fontWeight: '600'
          }}>
            Analytics Dashboard
          </h2>
          
          {dashboardStats ? (
            <AnalyticsDashboard stats={dashboardStats} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              Loading analytics...
            </div>
          )}
        </div>
      )}

      {activeTab === 'restaurants' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              fontSize: '2rem', 
              color: '#2c3e50', 
              margin: '0',
              fontWeight: '600'
            }}>
              Restaurant Management
            </h2>
            
            <button 
              onClick={() => setShowAddRestaurant(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ➕ Add Restaurant
            </button>
          </div>
          
          {showAddRestaurant ? (
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  color: '#2c3e50', 
                  margin: '0',
                  fontWeight: '600'
                }}>
                  Add New Restaurant
                </h3>
                
                <button 
                  onClick={() => setShowAddRestaurant(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
              
              <AdminAddRestaurantForm onSubmit={handleAddRestaurant} />
            </div>
          ) : null}
          
          <AdminRestaurantTable 
            restaurants={restaurants}
            onDelete={handleDeleteRestaurant}
          />
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <h2 style={{ 
            fontSize: '2rem', 
            color: '#2c3e50', 
            marginBottom: '20px',
            fontWeight: '600'
          }}>
            Booking Management
          </h2>
          
          <AdminBookingTable 
            bookings={bookings}
            onUpdateStatus={handleUpdateBookingStatus}
          />
        </div>
      )}
    </div>
  );
}

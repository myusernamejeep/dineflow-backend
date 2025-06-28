import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { adminAPI } from '../utils/api';
import LoadingOverlay from './LoadingOverlay';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, bookingsResponse] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecentBookings()
      ]);
      
      setStats(statsResponse);
      setRecentBookings(bookingsResponse.bookings || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#27ae60',
      cancelled: '#e74c3c',
      'checked-in': '#3498db',
      completed: '#9b59b6'
    };
    return colors[status] || '#7f8c8d';
  };

  if (loading) {
    return <LoadingOverlay message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button 
          onClick={loadDashboardData}
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
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px' 
      }}>
        <h1 style={{ 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontSize: '2.5rem',
          fontWeight: '600'
        }}>
          Admin Dashboard
        </h1>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0',
          fontSize: '16px'
        }}>
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#3498db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                📅
              </div>
              <div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '5px'
                }}>
                  {stats.totalBookings || 0}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#7f8c8d'
                }}>
                  Total Bookings
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#27ae60',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                ✅
              </div>
              <div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '5px'
                }}>
                  {stats.confirmedBookings || 0}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#7f8c8d'
                }}>
                  Confirmed Today
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#f39c12',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                🏪
              </div>
              <div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '5px'
                }}>
                  {stats.totalRestaurants || 0}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#7f8c8d'
                }}>
                  Active Restaurants
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#9b59b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                👥
              </div>
              <div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '5px'
                }}>
                  {stats.totalUsers || 0}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#7f8c8d'
                }}>
                  Registered Users
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          color: '#2c3e50',
          margin: '0 0 20px 0',
          fontSize: '1.3rem',
          fontWeight: '600'
        }}>
          🚀 Quick Actions
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <a 
            href="/admin/restaurants"
            style={{
              padding: '15px',
              background: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            🏪 Manage Restaurants
          </a>
          
          <a 
            href="/admin/bookings"
            style={{
              padding: '15px',
              background: '#27ae60',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
          >
            📅 View All Bookings
          </a>
          
          <a 
            href="/qr-checkin"
            style={{
              padding: '15px',
              background: '#f39c12',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f39c12'}
          >
            📱 QR Check-in Scanner
          </a>
          
          <a 
            href="/admin/analytics"
            style={{
              padding: '15px',
              background: '#9b59b6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#8e44ad'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#9b59b6'}
          >
            📊 Analytics Dashboard
          </a>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: '#2c3e50',
            margin: '0',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            📋 Recent Bookings
          </h3>
          
          <a 
            href="/admin/bookings"
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            View All
          </a>
        </div>

        {recentBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📅</div>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              No recent bookings found
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '15px'
          }}>
            {recentBookings.map(booking => (
              <div 
                key={booking._id}
                style={{
                  padding: '15px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  background: '#f8f9fa'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '1rem',
                      color: '#2c3e50',
                      margin: '0 0 5px 0',
                      fontWeight: '600'
                    }}>
                      {booking.customerName}
                    </h4>
                    <p style={{
                      color: '#7f8c8d',
                      margin: '0',
                      fontSize: '14px'
                    }}>
                      {booking.restaurantId?.name || 'Restaurant'}
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: getStatusColor(booking.bookingStatus)
                    }}>
                      {booking.bookingStatus}
                    </span>
                    
                    <span style={{
                      fontSize: '12px',
                      color: '#7f8c8d'
                    }}>
                      {formatDate(booking.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '10px',
                  fontSize: '13px'
                }}>
                  <div>
                    <strong style={{ color: '#2c3e50' }}>Date:</strong>
                    <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#2c3e50' }}>Time:</strong>
                    <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                      {booking.bookingTime}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#2c3e50' }}>Guests:</strong>
                    <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                      {booking.numGuests} people
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#2c3e50' }}>Table:</strong>
                    <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>
                      {booking.tableId}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

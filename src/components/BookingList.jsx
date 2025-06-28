import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { bookingAPI } from '../utils/api';
import BookingStatusBadge from './BookingStatusBadge';
import LoadingOverlay from './LoadingOverlay';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getHistory();
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setLoading(true);
      await bookingAPI.cancel(bookingId);
      await loadBookings();
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const filteredAndSortedBookings = bookings
    .filter(booking => {
      const matchesSearch = 
        booking.restaurantId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerPhone.includes(searchTerm);
      
      const matchesStatus = !filterStatus || booking.bookingStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.bookingDate) - new Date(a.bookingDate);
        case 'restaurant':
          return (a.restaurantId?.name || '').localeCompare(b.restaurantId?.name || '');
        case 'status':
          return a.bookingStatus.localeCompare(b.bookingStatus);
        default:
          return 0;
      }
    });

  if (loading) {
    return <LoadingOverlay message="Loading bookings..." />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button 
          onClick={loadBookings}
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
        <h2 style={{ 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontSize: '2rem',
          fontWeight: '600'
        }}>
          My Bookings
        </h2>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0',
          fontSize: '16px'
        }}>
          Manage and track your restaurant bookings
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              🔍 Search Bookings
            </label>
            <input
              type="text"
              placeholder="Search by restaurant or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              📊 Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="checked-in">Checked In</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              📋 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              <option value="date">Date</option>
              <option value="restaurant">Restaurant</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <p style={{
          color: '#7f8c8d',
          margin: '0',
          fontSize: '14px'
        }}>
          Showing {filteredAndSortedBookings.length} of {bookings.length} bookings
        </p>
        
        <button 
          onClick={loadBookings}
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
      </div>

      {/* Bookings List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {filteredAndSortedBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📅</div>
            <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>
              No bookings found
            </h3>
            <p style={{ color: '#7f8c8d', margin: '0 0 20px 0' }}>
              {searchTerm || filterStatus ? 'Try adjusting your search criteria' : 'You haven\'t made any bookings yet'}
            </p>
            {!searchTerm && !filterStatus && (
              <a 
                href="/booking" 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                Browse Restaurants
              </a>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '15px',
            padding: '20px'
          }}>
            {filteredAndSortedBookings.map(booking => (
              <div 
                key={booking._id}
                style={{
                  padding: '20px',
                  border: '1px solid #eee',
                  borderRadius: '10px',
                  background: '#f8f9fa'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '1.2rem',
                      color: '#2c3e50',
                      margin: '0 0 5px 0',
                      fontWeight: '600'
                    }}>
                      {booking.restaurantId?.name || 'Restaurant'}
                    </h4>
                    <p style={{
                      color: '#7f8c8d',
                      margin: '0',
                      fontSize: '14px'
                    }}>
                      📍 {booking.restaurantId?.address || 'Address not available'}
                    </p>
                  </div>
                  
                  <BookingStatusBadge status={booking.bookingStatus} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>Date:</strong> {formatDate(booking.bookingDate)}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>Time:</strong> {formatTime(booking.bookingTime)}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>Guests:</strong> {booking.numGuests} people
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>Name:</strong> {booking.customerName}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>Phone:</strong> {booking.customerPhone}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>Table:</strong> {booking.tableId}
                    </p>
                  </div>
                </div>

                {/* Special Requests & Dietary Restrictions */}
                {(booking.specialRequests || booking.dietaryRestrictions) && (
                  <div style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}>
                    {booking.specialRequests && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ fontSize: '14px', color: '#2c3e50' }}>
                          Special Requests:
                        </strong>
                        <p style={{
                          margin: '5px 0 0 0',
                          fontSize: '14px',
                          color: '#7f8c8d'
                        }}>
                          {booking.specialRequests}
                        </p>
                      </div>
                    )}
                    
                    {booking.dietaryRestrictions && (
                      <div>
                        <strong style={{ fontSize: '14px', color: '#2c3e50' }}>
                          Dietary Restrictions:
                        </strong>
                        <p style={{
                          margin: '5px 0 0 0',
                          fontSize: '14px',
                          color: '#7f8c8d'
                        }}>
                          {booking.dietaryRestrictions}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Actions */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  {/* Cancel Button */}
                  {['pending', 'confirmed'].includes(booking.bookingStatus) && (
                    <button 
                      onClick={() => handleCancelBooking(booking._id)}
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
                      ❌ Cancel
                    </button>
                  )}

                  {/* Rebook Button for cancelled/completed bookings */}
                  {['cancelled', 'checked-in'].includes(booking.bookingStatus) && (
                    <a 
                      href="/booking" 
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    >
                      🔄 Rebook
                    </a>
                  )}

                  {/* View Details Button */}
                  <a 
                    href={`/bookings/${booking._id}`}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  >
                    👁️ View Details
                  </a>
                </div>

                {/* Booking Timestamps */}
                <div style={{
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #eee',
                  fontSize: '12px',
                  color: '#7f8c8d'
                }}>
                  <p style={{ margin: '2px 0' }}>
                    <strong>Created:</strong> {formatDate(booking.createdAt)}
                  </p>
                  {booking.cancelledAt && (
                    <p style={{ margin: '2px 0' }}>
                      <strong>Cancelled:</strong> {formatDate(booking.cancelledAt)}
                    </p>
                  )}
                  {booking.checkedInAt && (
                    <p style={{ margin: '2px 0' }}>
                      <strong>Checked-in:</strong> {formatDate(booking.checkedInAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

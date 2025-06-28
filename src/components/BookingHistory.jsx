import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { bookingAPI } from '../utils/api';
import BookingStatusBadge from './BookingStatusBadge';
import BookingQrModal from './BookingQrModal';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

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
      setError('Failed to load booking history. Please try again.');
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
      
      // Reload bookings
      await loadBookings();
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQr = (booking) => {
    setSelectedBooking(booking);
    setShowQrModal(true);
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    setSelectedBooking(null);
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
        <p style={{ color: '#7f8c8d' }}>Loading your bookings...</p>
      </div>
    );
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

  if (bookings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📅</div>
        <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>No Bookings Yet</h3>
        <p style={{ color: '#7f8c8d', margin: '0 0 20px 0' }}>
          You haven't made any bookings yet. Start by exploring our restaurants!
        </p>
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
      </div>
    );
  }

  return (
    <div>
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
          Your Bookings ({bookings.length})
        </h3>
        
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

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px' 
      }}>
        {bookings.map(booking => (
          <div 
            key={booking._id}
            style={{
              background: 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #eee'
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
              gridTemplateColumns: '1fr 1fr', 
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
                background: '#f8f9fa', 
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
              {/* QR Code Button */}
              {booking.bookingStatus === 'confirmed' && (
                <button 
                  onClick={() => handleShowQr(booking)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  📱 Show QR
                </button>
              )}

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

      {/* QR Modal */}
      {showQrModal && selectedBooking && (
        <BookingQrModal 
          booking={selectedBooking}
          onClose={handleCloseQrModal}
        />
      )}
    </div>
  );
}

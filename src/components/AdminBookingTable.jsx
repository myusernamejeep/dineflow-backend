import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { adminAPI } from '../utils/api';
import LoadingOverlay from './LoadingOverlay';
import BookingStatusBadge from './BookingStatusBadge';

export default function AdminBookingTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllBookings();
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      setLoading(true);
      await adminAPI.deleteBooking(bookingId);
      await loadBookings();
      setShowDeleteModal(false);
      setSelectedBooking(null);
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.restaurantId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerPhone.includes(searchTerm);
    
    const matchesStatus = !filterStatus || booking.bookingStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
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
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h2 style={{ 
            color: '#2c3e50', 
            margin: '0 0 10px 0',
            fontSize: '2rem',
            fontWeight: '600'
          }}>
            Booking Management
          </h2>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0',
            fontSize: '16px'
          }}>
            Manage all bookings in the system
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <a 
            href="/qr-checkin"
            style={{
              padding: '12px 24px',
              backgroundColor: '#f39c12',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📱 QR Scanner
          </a>
          
          <a 
            href="/admin/analytics"
            style={{
              padding: '12px 24px',
              backgroundColor: '#9b59b6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📊 Analytics
          </a>
        </div>
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
          gridTemplateColumns: '1fr auto',
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
              placeholder="Search by customer name, restaurant, or phone..."
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
          Showing {filteredBookings.length} of {bookings.length} bookings
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

      {/* Bookings Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📅</div>
            <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>
              No bookings found
            </h3>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              {searchTerm || filterStatus ? 'Try adjusting your search criteria' : 'No bookings have been made yet'}
            </p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6'
                }}>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Customer
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Restaurant
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Date & Time
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Details
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking, index) => (
                  <tr 
                    key={booking._id}
                    style={{
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}
                  >
                    <td style={{ padding: '15px' }}>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '5px'
                        }}>
                          {booking.customerName}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#7f8c8d'
                        }}>
                          📞 {booking.customerPhone}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {booking.restaurantId?.name || 'Restaurant'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#7f8c8d'
                      }}>
                        🏪 {booking.restaurantId?.address || 'Address N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        📅 {formatDate(booking.bookingDate)}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#7f8c8d'
                      }}>
                        ⏰ {formatTime(booking.bookingTime)}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#2c3e50'
                      }}>
                        👥 {booking.numGuests} people
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#7f8c8d'
                      }}>
                        🪑 Table {booking.tableId}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <BookingStatusBadge status={booking.bookingStatus} />
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center'
                      }}>
                        <a 
                          href={`/admin/bookings/${booking._id}`}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontSize: '12px'
                          }}
                        >
                          👁️ View
                        </a>
                        
                        <button 
                          onClick={() => confirmDelete(booking)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              Delete Booking
            </h3>
            <p style={{
              color: '#7f8c8d',
              margin: '0 0 20px 0',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete the booking for <strong>{selectedBooking.customerName}</strong>? 
              This action cannot be undone.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedBooking(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              
              <button 
                onClick={() => handleDeleteBooking(selectedBooking._id)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

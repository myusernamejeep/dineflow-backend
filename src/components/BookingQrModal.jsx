import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function BookingQrModal({ booking, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (booking) {
      // Generate QR code data
      const qrData = JSON.stringify({
        bookingId: booking._id,
        restaurantId: booking.restaurantId?._id,
        customerName: booking.customerName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        tableId: booking.tableId
      });

      // Use a QR code generation service
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [booking]);

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

  if (!booking) return null;

  return (
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
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#7f8c8d'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📱</div>
          <h3 style={{ 
            color: '#2c3e50', 
            margin: '0 0 10px 0',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Booking QR Code
          </h3>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0',
            fontSize: '14px'
          }}>
            Show this QR code to the restaurant staff for check-in
          </p>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          {qrCodeUrl ? (
            <div style={{
              display: 'inline-block',
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <img 
                src={qrCodeUrl} 
                alt="Booking QR Code"
                style={{
                  width: '200px',
                  height: '200px',
                  display: 'block'
                }}
              />
            </div>
          ) : (
            <div style={{
              width: '200px',
              height: '200px',
              background: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ color: '#7f8c8d' }}>Loading QR Code...</div>
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h4 style={{ 
            color: '#2c3e50', 
            margin: '0 0 15px 0',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            Booking Details
          </h4>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Restaurant:</span>
              <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                {booking.restaurantId?.name || 'Restaurant'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Date:</span>
              <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                {formatDate(booking.bookingDate)}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Time:</span>
              <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                {formatTime(booking.bookingTime)}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Guests:</span>
              <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                {booking.numGuests} people
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Table:</span>
              <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                {booking.tableId}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Name:</span>
              <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '500' }}>
                {booking.customerName}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#e8f4fd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h5 style={{ 
            color: '#2c3e50', 
            margin: '0 0 10px 0',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            📋 Check-in Instructions:
          </h5>
          <ul style={{ 
            margin: '0', 
            paddingLeft: '20px',
            fontSize: '13px',
            color: '#2c3e50'
          }}>
            <li>Arrive at the restaurant on time</li>
            <li>Show this QR code to the staff</li>
            <li>Present a valid ID for verification</li>
            <li>Enjoy your dining experience!</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
          
          <button 
            onClick={() => {
              if (qrCodeUrl) {
                const link = document.createElement('a');
                link.href = qrCodeUrl;
                link.download = `booking-qr-${booking._id}.png`;
                link.click();
              }
            }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📥 Download QR
          </button>
        </div>
      </div>
    </div>
  );
}

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { bookingAPI, authAPI, apiUtils } from '../utils/api';
import CheckinQrScanner from '../components/CheckinQrScanner';
import LoadingOverlay from '../components/LoadingOverlay';

export default function QrCheckin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedBooking, setScannedBooking] = useState(null);
  const [checkinResult, setCheckinResult] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
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
        setError('Access denied. Admin privileges required for QR check-in.');
        return;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
        apiUtils.clearAuth();
        window.location.href = '/login';
      } else {
        setError('Failed to load user data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQrScan = async (qrData) => {
    try {
      setLoading(true);
      setScanning(false);
      
      // Parse QR data (assuming it contains booking ID)
      const bookingId = qrData;
      
      if (!bookingId) {
        throw new Error('Invalid QR code data');
      }

      // Get booking details
      const bookingData = await bookingAPI.getById(bookingId);
      setScannedBooking(bookingData.booking);
      
    } catch (error) {
      console.error('QR scan error:', error);
      setError('Invalid QR code or booking not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!scannedBooking) return;

    try {
      setLoading(true);
      
      await bookingAPI.checkin(scannedBooking._id);
      
      setCheckinResult({
        success: true,
        message: 'Check-in successful! Customer has been notified via LINE.',
        booking: scannedBooking
      });
      
      // Clear scanned booking after successful check-in
      setTimeout(() => {
        setScannedBooking(null);
        setCheckinResult(null);
      }, 5000);
      
    } catch (error) {
      console.error('Check-in error:', error);
      setCheckinResult({
        success: false,
        message: 'Check-in failed. Please try again.',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCheckin = () => {
    setScannedBooking(null);
    setCheckinResult(null);
    setError(null);
  };

  const handleStartScanning = () => {
    setScanning(true);
    setError(null);
    setScannedBooking(null);
    setCheckinResult(null);
  };

  const handleStopScanning = () => {
    setScanning(false);
  };

  if (loading) {
    return <LoadingOverlay message="Loading QR check-in..." />;
  }

  if (error && !user?.isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <a 
          href="/" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block'
          }}
        >
          Go to Home
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
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
            📱 QR Check-in
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#7f8c8d', 
            margin: '0' 
          }}>
            Scan customer QR codes to check them in
          </p>
        </div>
        
        <a 
          href="/admin" 
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        >
          ← Back to Admin
        </a>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Check-in Result */}
      {checkinResult && (
        <div style={{
          background: checkinResult.success ? '#d4edda' : '#f8d7da',
          color: checkinResult.success ? '#155724' : '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {checkinResult.success ? '✅ Success' : '❌ Error'}
          </div>
          {checkinResult.message}
        </div>
      )}

      {/* QR Scanner */}
      {scanning && (
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            margin: '0 0 20px 0',
            fontWeight: '600'
          }}>
            📱 Scanning QR Code
          </h2>
          
          <CheckinQrScanner 
            onScan={handleQrScan}
            onError={(error) => setError(error)}
          />
          
          <button 
            onClick={handleStopScanning}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Stop Scanning
          </button>
        </div>
      )}

      {/* Scanned Booking Details */}
      {scannedBooking && !checkinResult && (
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            margin: '0 0 20px 0',
            fontWeight: '600'
          }}>
            📋 Booking Details
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{ 
                fontSize: '1.1rem', 
                color: '#2c3e50', 
                margin: '0 0 10px 0',
                fontWeight: '600'
              }}>
                Customer Information
              </h3>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Name:</strong> {scannedBooking.customerName}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Email:</strong> {scannedBooking.customerEmail}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Phone:</strong> {scannedBooking.customerPhone}
              </p>
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '1.1rem', 
                color: '#2c3e50', 
                margin: '0 0 10px 0',
                fontWeight: '600'
              }}>
                Booking Information
              </h3>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Date:</strong> {scannedBooking.bookingDate}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Time:</strong> {scannedBooking.bookingTime}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Guests:</strong> {scannedBooking.numGuests} people
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Status:</strong> 
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginLeft: '5px',
                  background: scannedBooking.bookingStatus === 'confirmed' ? '#d4edda' : '#fff3cd',
                  color: scannedBooking.bookingStatus === 'confirmed' ? '#155724' : '#856404'
                }}>
                  {scannedBooking.bookingStatus}
                </span>
              </p>
            </div>
          </div>

          {scannedBooking.specialRequests && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                color: '#2c3e50', 
                margin: '0 0 5px 0',
                fontWeight: '600'
              }}>
                Special Requests
              </h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>
                {scannedBooking.specialRequests}
              </p>
            </div>
          )}

          {scannedBooking.dietaryRestrictions && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                color: '#2c3e50', 
                margin: '0 0 5px 0',
                fontWeight: '600'
              }}>
                Dietary Restrictions
              </h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>
                {scannedBooking.dietaryRestrictions}
              </p>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '10px',
            justifyContent: 'center'
          }}>
            <button 
              onClick={handleCheckin}
              disabled={scannedBooking.bookingStatus !== 'confirmed'}
              style={{
                padding: '12px 24px',
                backgroundColor: scannedBooking.bookingStatus === 'confirmed' ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: scannedBooking.bookingStatus === 'confirmed' ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              ✅ Check-in Customer
            </button>
            
            <button 
              onClick={handleCancelCheckin}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕ Cancel
            </button>
          </div>

          {scannedBooking.bookingStatus !== 'confirmed' && (
            <p style={{ 
              textAlign: 'center', 
              color: '#e74c3c', 
              marginTop: '10px',
              fontSize: '14px'
            }}>
              Cannot check-in: Booking status is "{scannedBooking.bookingStatus}"
            </p>
          )}
        </div>
      )}

      {/* Start Scanning Button */}
      {!scanning && !scannedBooking && (
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📱</div>
          <h2 style={{ 
            fontSize: '1.8rem', 
            color: '#2c3e50', 
            margin: '0 0 15px 0',
            fontWeight: '600'
          }}>
            Ready to Scan
          </h2>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0 0 30px 0',
            fontSize: '1.1rem',
            lineHeight: '1.6'
          }}>
            Click the button below to start scanning customer QR codes for check-in
          </p>
          
          <button 
            onClick={handleStartScanning}
            style={{
              padding: '15px 30px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '0 auto'
            }}
          >
            📱 Start QR Scanner
          </button>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#f8f9fa',
        borderRadius: '10px',
        padding: '20px',
        marginTop: '30px'
      }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          color: '#2c3e50', 
          margin: '0 0 15px 0',
          fontWeight: '600'
        }}>
          📋 How to Use QR Check-in
        </h3>
        <ol style={{ 
          margin: '0', 
          padding: '0 0 0 20px',
          color: '#7f8c8d',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <li>Click "Start QR Scanner" to activate the camera</li>
          <li>Point the camera at the customer's QR code</li>
          <li>Review the booking details that appear</li>
          <li>Click "Check-in Customer" to confirm</li>
          <li>The customer will receive a notification via LINE</li>
        </ol>
      </div>
    </div>
  );
}

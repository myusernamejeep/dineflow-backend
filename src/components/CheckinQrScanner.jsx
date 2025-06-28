import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { bookingAPI } from '../utils/api';

export default function CheckinQrScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checkinResult, setCheckinResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setResult(null);
      setCheckinResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setScanning(true);

      // Start QR code detection
      detectQRCode();
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const detectQRCode = () => {
    if (!scanning || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    if (video.videoWidth === 0) {
      // Video not ready yet
      requestAnimationFrame(detectQRCode);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Use jsQR library for QR detection
    if (window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        handleQRCodeDetected(code.data);
        return;
      }
    }

    // Continue scanning
    requestAnimationFrame(detectQRCode);
  };

  const handleQRCodeDetected = async (qrData) => {
    try {
      const data = JSON.parse(qrData);
      setResult(data);
      stopScanning();

      // Process the booking check-in
      await processCheckin(data);
    } catch (error) {
      console.error('Error parsing QR code:', error);
      setError('Invalid QR code format. Please try again.');
      setScanning(false);
    }
  };

  const processCheckin = async (bookingData) => {
    try {
      const response = await bookingAPI.checkin(bookingData.bookingId);
      setCheckinResult({
        success: true,
        message: 'Customer checked in successfully!',
        booking: response.booking
      });
    } catch (error) {
      console.error('Error checking in:', error);
      setCheckinResult({
        success: false,
        message: error.message || 'Failed to check in customer.'
      });
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setCheckinResult(null);
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontSize: '2rem',
          fontWeight: '600'
        }}>
          QR Code Check-in Scanner
        </h2>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0',
          fontSize: '16px'
        }}>
          Scan customer QR codes to check them in
        </p>
      </div>

      {/* Camera View */}
      {scanning && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          position: 'relative'
        }}>
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            style={{
              width: '100%',
              maxWidth: '400px',
              borderRadius: '10px',
              border: '3px solid #3498db'
            }}
          />
          <canvas 
            ref={canvasRef}
            style={{ display: 'none' }}
          />
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            border: '2px solid #3498db',
            borderRadius: '10px',
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              width: '20px',
              height: '20px',
              borderTop: '3px solid #3498db',
              borderLeft: '3px solid #3498db'
            }} />
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              borderTop: '3px solid #3498db',
              borderRight: '3px solid #3498db'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              left: '-2px',
              width: '20px',
              height: '20px',
              borderBottom: '3px solid #3498db',
              borderLeft: '3px solid #3498db'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              borderBottom: '3px solid #3498db',
              borderRight: '3px solid #3498db'
            }} />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        {!scanning ? (
          <button 
            onClick={startScanning}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            📷 Start Scanning
          </button>
        ) : (
          <button 
            onClick={stopScanning}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            ⏹️ Stop Scanning
          </button>
        )}

        {(result || error || checkinResult) && (
          <button 
            onClick={resetScanner}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            🔄 Reset
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>⚠️</div>
          <p style={{ margin: '0', fontSize: '14px' }}>{error}</p>
        </div>
      )}

      {/* QR Code Result */}
      {result && (
        <div style={{
          background: '#d1ecf1',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            color: '#0c5460', 
            margin: '0 0 15px 0',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            📋 QR Code Detected
          </h3>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0c5460', fontSize: '14px' }}>Booking ID:</span>
              <span style={{ color: '#0c5460', fontSize: '14px', fontWeight: '500' }}>
                {result.bookingId}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0c5460', fontSize: '14px' }}>Customer:</span>
              <span style={{ color: '#0c5460', fontSize: '14px', fontWeight: '500' }}>
                {result.customerName}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0c5460', fontSize: '14px' }}>Date:</span>
              <span style={{ color: '#0c5460', fontSize: '14px', fontWeight: '500' }}>
                {formatDate(result.bookingDate)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0c5460', fontSize: '14px' }}>Time:</span>
              <span style={{ color: '#0c5460', fontSize: '14px', fontWeight: '500' }}>
                {formatTime(result.bookingTime)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0c5460', fontSize: '14px' }}>Table:</span>
              <span style={{ color: '#0c5460', fontSize: '14px', fontWeight: '500' }}>
                {result.tableId}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Result */}
      {checkinResult && (
        <div style={{
          background: checkinResult.success ? '#d4edda' : '#f8d7da',
          color: checkinResult.success ? '#155724' : '#721c24',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '15px' 
          }}>
            {checkinResult.success ? '✅' : '❌'}
          </div>
          <h3 style={{ 
            margin: '0 0 10px 0',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            {checkinResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
          </h3>
          <p style={{ margin: '0', fontSize: '16px' }}>
            {checkinResult.message}
          </p>
          
          {checkinResult.success && checkinResult.booking && (
            <div style={{
              background: 'rgba(255,255,255,0.3)',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '15px'
            }}>
              <h4 style={{ 
                margin: '0 0 10px 0',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Updated Booking Details
              </h4>
              <div style={{ display: 'grid', gap: '5px', fontSize: '14px' }}>
                <div>Status: <strong>Checked In</strong></div>
                <div>Check-in Time: <strong>{new Date().toLocaleTimeString()}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '30px'
      }}>
        <h4 style={{ 
          color: '#2c3e50', 
          margin: '0 0 15px 0',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          📖 How to use the scanner:
        </h4>
        <ol style={{ 
          margin: '0', 
          paddingLeft: '20px',
          fontSize: '14px',
          color: '#2c3e50'
        }}>
          <li>Click "Start Scanning" to activate the camera</li>
          <li>Point the camera at the customer's QR code</li>
          <li>Hold steady until the QR code is detected</li>
          <li>Review the booking details and confirm check-in</li>
          <li>Use "Reset" to scan another customer</li>
        </ol>
      </div>
    </div>
  );
}

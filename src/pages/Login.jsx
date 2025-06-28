import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { authAPI, apiUtils } from '../utils/api';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    if (apiUtils.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLineLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // LINE Login URL with your channel ID
      const channelId = process.env.REACT_APP_LINE_CHANNEL_ID || 'YOUR_LINE_CHANNEL_ID';
      const redirectUri = encodeURIComponent(window.location.origin + '/login/callback');
      const state = Math.random().toString(36).substring(7);
      
      // Store state for verification
      localStorage.setItem('lineLoginState', state);
      
      // Redirect to LINE Login
      const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`;
      
      window.location.href = lineLoginUrl;
    } catch (error) {
      console.error('LINE Login error:', error);
      setError('Failed to initiate LINE login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginCallback = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const savedState = localStorage.getItem('lineLoginState');

      // Verify state parameter
      if (!code || !state || state !== savedState) {
        throw new Error('Invalid login response');
      }

      // Clear state from localStorage
      localStorage.removeItem('lineLoginState');

      // Exchange code for token
      const response = await authAPI.lineLogin(code);
      
      // Store token and user data
      apiUtils.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Login callback error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle login callback if code is present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleLoginCallback();
    }
  }, []);

  if (loading) {
    return <LoadingOverlay message="Processing login..." />;
  }

  if (isAuthenticated) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ 
          background: '#d4edda', 
          color: '#155724', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 10px 0' }}>✅ Already Logged In</h2>
          <p style={{ margin: '0 0 20px 0' }}>
            You are already authenticated. Redirecting to home page...
          </p>
          <a 
            href="/" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              display: 'inline-block'
            }}
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '10px' 
          }}>
            🍽️
          </div>
          <h1 style={{ 
            fontSize: '2rem', 
            color: '#2c3e50', 
            margin: '0 0 5px 0',
            fontWeight: 'bold'
          }}>
            DineFlow
          </h1>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0',
            fontSize: '1.1rem'
          }}>
            Restaurant Booking System
          </p>
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
          </div>
        )}

        {/* Login Form */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            margin: '0 0 20px 0',
            fontWeight: '600'
          }}>
            Welcome Back
          </h2>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0 0 30px 0',
            lineHeight: '1.6'
          }}>
            Sign in with your LINE account to access your bookings and receive notifications
          </p>

          <button 
            onClick={handleLineLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px 20px',
              backgroundColor: '#00B900',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#009900';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#00B900';
              }
            }}
          >
            <div style={{ fontSize: '20px' }}>📱</div>
            {loading ? 'Connecting...' : 'Login with LINE'}
          </button>
        </div>

        {/* Features */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '10px',
          textAlign: 'left'
        }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            color: '#2c3e50', 
            margin: '0 0 15px 0',
            fontWeight: '600'
          }}>
            Why Login with LINE?
          </h3>
          <ul style={{ 
            margin: '0', 
            padding: '0 0 0 20px',
            color: '#7f8c8d',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li>Quick and secure authentication</li>
            <li>Receive booking confirmations</li>
            <li>Get status updates and reminders</li>
            <li>Easy access to booking history</li>
            <li>No need to remember passwords</li>
          </ul>
        </div>

        {/* Back to Home */}
        <div style={{ marginTop: '30px' }}>
          <a 
            href="/" 
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

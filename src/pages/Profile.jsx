import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { authAPI, bookingAPI, apiUtils } from '../utils/api';
import UserInfoBar from '../components/UserInfoBar';
import BookingHistory from '../components/BookingHistory';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [lineOAId, setLineOAId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!apiUtils.isAuthenticated()) {
        window.location.href = '/login';
        return;
      }

      // Load user profile
      const userData = await authAPI.getProfile();
      setUser(userData.user);

      // Load LINE OA ID
      const lineData = await authAPI.getLineOAId();
      setLineOAId(lineData.lineOAId);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
        apiUtils.clearAuth();
        window.location.href = '/login';
      } else {
        setError('Failed to load profile data. Please try again.');
      }
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
      window.location.href = '/';
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading profile..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button 
          onClick={loadProfileData}
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

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red' }}>User not found. Please login again.</div>
        <a 
          href="/login" 
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
          Go to Login
        </a>
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
            👤 My Profile
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#7f8c8d', 
            margin: '0' 
          }}>
            Manage your account and view booking history
          </p>
        </div>
        
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

      {/* User Info Bar */}
      <UserInfoBar user={user} lineOAId={lineOAId} onLogout={handleLogout} />

      {/* Profile Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 2fr', 
        gap: '30px',
        marginTop: '30px'
      }}>
        {/* Profile Card */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            margin: '0 0 20px 0',
            fontWeight: '600'
          }}>
            Profile Information
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <img 
              src={user.pictureUrl} 
              alt="Profile" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%',
                marginBottom: '15px'
              }} 
            />
            <h3 style={{ 
              fontSize: '1.2rem', 
              color: '#2c3e50', 
              margin: '0 0 5px 0',
              fontWeight: '600'
            }}>
              {user.displayName}
            </h3>
            <p style={{ 
              color: '#7f8c8d', 
              margin: '0',
              fontSize: '14px'
            }}>
              {user.email || 'No email provided'}
            </p>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              color: '#2c3e50', 
              margin: '0 0 10px 0',
              fontWeight: '600'
            }}>
              Account Details
            </h4>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              <p style={{ margin: '5px 0' }}>
                <strong>User ID:</strong> {user._id}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Account Type:</strong> {user.isAdmin ? 'Admin' : 'User'}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>LINE Connected:</strong> {user.lineUserId ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>

        {/* Booking History */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            margin: '0 0 20px 0',
            fontWeight: '600'
          }}>
            Booking History
          </h2>
          
          <BookingHistory />
        </div>
      </div>

      {/* Admin Panel Link */}
      {user.isAdmin && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px',
          backgroundColor: '#e8f4fd',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
            🛠️ Admin Access
          </h3>
          <p style={{ margin: '0 0 15px 0', color: '#7f8c8d' }}>
            You have administrator privileges. Access the admin panel to manage restaurants and bookings.
          </p>
          <a 
            href="/admin" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#9b59b6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Go to Admin Panel
          </a>
        </div>
      )}
    </div>
  );
}

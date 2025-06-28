import { h } from 'preact';
import { useState } from 'preact/hooks';
import { logout } from '../utils/auth';

export default function UserInfoBar({ user }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <div style={{
      background: 'white',
      padding: '15px 20px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#3498db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '2px'
          }}>
            {user.name || 'User'}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#7f8c8d'
          }}>
            {user.email || user.lineId || 'Guest User'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚙️</span>
          Menu
          <span style={{ fontSize: '12px' }}>
            {showDropdown ? '▲' : '▼'}
          </span>
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '150px',
            zIndex: 1000,
            marginTop: '5px'
          }}>
            <a 
              href="/profile"
              style={{
                display: 'block',
                padding: '12px 16px',
                textDecoration: 'none',
                color: '#2c3e50',
                fontSize: '14px',
                borderBottom: '1px solid #eee'
              }}
              onClick={() => setShowDropdown(false)}
            >
              👤 Profile
            </a>
            
            <a 
              href="/booking"
              style={{
                display: 'block',
                padding: '12px 16px',
                textDecoration: 'none',
                color: '#2c3e50',
                fontSize: '14px',
                borderBottom: '1px solid #eee'
              }}
              onClick={() => setShowDropdown(false)}
            >
              📅 My Bookings
            </a>

            {user.role === 'admin' && (
              <a 
                href="/admin"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: '#2c3e50',
                  fontSize: '14px',
                  borderBottom: '1px solid #eee'
                }}
                onClick={() => setShowDropdown(false)}
              >
                🛠️ Admin Panel
              </a>
            )}

            <button 
              onClick={handleLogout}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                color: '#e74c3c',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

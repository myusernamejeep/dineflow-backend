import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function LineOAFriendBox({ lineOAId }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!lineOAId) return null;

  const handleAddFriend = () => {
    // Open LINE app to add friend
    const lineUrl = `https://line.me/R/ti/p/@${lineOAId}`;
    window.open(lineUrl, '_blank');
  };

  return (
    <div style={{
      background: '#00B900',
      color: 'white',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '500'
    }}
    onClick={() => setShowDetails(!showDetails)}
    >
      <span style={{ fontSize: '14px' }}>💬</span>
      LINE Friend
      
      {showDetails && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '200px',
          zIndex: 1000,
          marginTop: '5px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</div>
            <h4 style={{ 
              color: '#2c3e50', 
              margin: '0 0 5px 0',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Add us on LINE!
            </h4>
            <p style={{ 
              color: '#7f8c8d', 
              margin: '0',
              fontSize: '12px'
            }}>
              Get booking updates and exclusive offers
            </p>
          </div>
          
          <button 
            onClick={handleAddFriend}
            style={{
              width: '100%',
              padding: '10px',
              background: '#00B900',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Add Friend
          </button>
        </div>
      )}
    </div>
  );
}

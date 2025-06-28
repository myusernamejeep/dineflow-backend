import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { adminAPI } from '../utils/api';
import LoadingOverlay from './LoadingOverlay';

export default function AdminRestaurantTable() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRestaurants();
      setRestaurants(response.restaurants || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      setLoading(true);
      await adminAPI.deleteRestaurant(restaurantId);
      await loadRestaurants();
      setShowDeleteModal(false);
      setSelectedRestaurant(null);
      alert('Restaurant deleted successfully!');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('Failed to delete restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDeleteModal(true);
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (loading) {
    return <LoadingOverlay message="Loading restaurants..." />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button 
          onClick={loadRestaurants}
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
            Restaurant Management
          </h2>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0',
            fontSize: '16px'
          }}>
            Manage all restaurants in the system
          </p>
        </div>
        
        <a 
          href="/admin/restaurants/add"
          style={{
            padding: '12px 24px',
            backgroundColor: '#27ae60',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ➕ Add Restaurant
        </a>
      </div>

      {/* Restaurant Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏪</div>
            <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>
              No restaurants found
            </h3>
            <p style={{ color: '#7f8c8d', margin: '0 0 20px 0' }}>
              Start by adding your first restaurant
            </p>
            <a 
              href="/admin/restaurants/add"
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              Add Restaurant
            </a>
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
                    Restaurant
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Cuisine
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Address
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Hours
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '14px'
                  }}>
                    Capacity
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
                {restaurants.map((restaurant, index) => (
                  <tr 
                    key={restaurant._id}
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
                          {restaurant.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#7f8c8d'
                        }}>
                          ID: {restaurant._id}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: '#e8f4fd',
                        color: '#3498db',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {restaurant.cuisine || 'International'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#2c3e50',
                        maxWidth: '200px'
                      }}>
                        {restaurant.address}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#2c3e50'
                      }}>
                        {formatTime(restaurant.openingTime)} - {formatTime(restaurant.closingTime)}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#2c3e50'
                      }}>
                        {restaurant.capacity || 'N/A'} people
                      </div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center'
                      }}>
                        <a 
                          href={`/admin/restaurants/edit/${restaurant._id}`}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontSize: '12px'
                          }}
                        >
                          ✏️ Edit
                        </a>
                        
                        <button 
                          onClick={() => confirmDelete(restaurant)}
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
      {showDeleteModal && selectedRestaurant && (
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
              Delete Restaurant
            </h3>
            <p style={{
              color: '#7f8c8d',
              margin: '0 0 20px 0',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong>{selectedRestaurant.name}</strong>? 
              This action cannot be undone and will also delete all associated bookings.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRestaurant(null);
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
                onClick={() => handleDeleteRestaurant(selectedRestaurant._id)}
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

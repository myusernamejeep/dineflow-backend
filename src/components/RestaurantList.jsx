import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { restaurantAPI } from '../utils/api';
import RestaurantCard from './RestaurantCard';
import LoadingOverlay from './LoadingOverlay';

export default function RestaurantList({ onRestaurantSelect }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const response = await restaurantAPI.getAll();
      setRestaurants(response.restaurants || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSelect = (restaurant) => {
    if (onRestaurantSelect) {
      onRestaurantSelect(restaurant);
    }
  };

  const filteredAndSortedRestaurants = restaurants
    .filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCuisine = !selectedCuisine || restaurant.cuisine === selectedCuisine;
      
      return matchesSearch && matchesCuisine;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'price':
          return (a.priceRange || '').localeCompare(b.priceRange || '');
        default:
          return 0;
      }
    });

  const getUniqueCuisines = () => {
    const cuisines = restaurants.map(r => r.cuisine).filter(Boolean);
    return [...new Set(cuisines)].sort();
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
        textAlign: 'center', 
        marginBottom: '30px' 
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontSize: '2rem',
          fontWeight: '600'
        }}>
          Browse Restaurants
        </h2>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0',
          fontSize: '16px'
        }}>
          Discover amazing dining experiences
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '15px',
          alignItems: 'end'
        }}>
          {/* Search */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              🔍 Search Restaurants
            </label>
            <input
              type="text"
              placeholder="Search by name, address, or cuisine..."
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

          {/* Cuisine Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              🍽️ Cuisine
            </label>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              <option value="">All Cuisines</option>
              {getUniqueCuisines().map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              📊 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="price">Price</option>
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
          Showing {filteredAndSortedRestaurants.length} of {restaurants.length} restaurants
        </p>
        
        <button 
          onClick={loadRestaurants}
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

      {/* Restaurant Grid */}
      {filteredAndSortedRestaurants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🍽️</div>
          <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>
            No restaurants found
          </h3>
          <p style={{ color: '#7f8c8d', margin: '0 0 20px 0' }}>
            Try adjusting your search criteria or filters
          </p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedCuisine('');
              setSortBy('name');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredAndSortedRestaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant._id}
              restaurant={restaurant}
              onBookNow={handleRestaurantSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

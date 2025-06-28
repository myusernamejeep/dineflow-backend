import { h } from 'preact';
import { useState } from 'preact/hooks';
import { adminAPI } from '../utils/api';
import LoadingOverlay from './LoadingOverlay';

export default function AdminAddRestaurantForm() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    cuisine: '',
    description: '',
    openingTime: '09:00',
    closingTime: '22:00',
    capacity: '',
    numTables: '',
    priceRange: '$$',
    rating: '4.5',
    image: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cuisines = [
    'Thai', 'Japanese', 'Chinese', 'Italian', 'American', 
    'Mexican', 'Indian', 'Korean', 'French', 'Mediterranean',
    'Vietnamese', 'Thai Fusion', 'International'
  ];

  const priceRanges = ['$', '$$', '$$$', '$$$$'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Restaurant name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (include http:// or https://)';
    }

    if (!formData.cuisine) {
      newErrors.cuisine = 'Cuisine type is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (!formData.numTables || formData.numTables < 1) {
      newErrors.numTables = 'Number of tables must be at least 1';
    }

    if (formData.openingTime >= formData.closingTime) {
      newErrors.closingTime = 'Closing time must be after opening time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await adminAPI.createRestaurant(formData);
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          address: '',
          phone: '',
          email: '',
          website: '',
          cuisine: '',
          description: '',
          openingTime: '09:00',
          closingTime: '22:00',
          capacity: '',
          numTables: '',
          priceRange: '$$',
          rating: '4.5',
          image: ''
        });
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setErrors({ submit: error.message || 'Failed to create restaurant. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      cuisine: '',
      description: '',
      openingTime: '09:00',
      closingTime: '22:00',
      capacity: '',
      numTables: '',
      priceRange: '$$',
      rating: '4.5',
      image: ''
    });
    setErrors({});
    setSuccess(false);
  };

  if (loading) {
    return <LoadingOverlay message="Creating restaurant..." />;
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px' 
      }}>
        <h1 style={{ 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontSize: '2.5rem',
          fontWeight: '600'
        }}>
          Add New Restaurant
        </h1>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0',
          fontSize: '16px'
        }}>
          Fill in the details to add a new restaurant to the system
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>✅</div>
          <p style={{ margin: '0', fontSize: '16px' }}>
            Restaurant created successfully! Redirecting...
          </p>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>⚠️</div>
          <p style={{ margin: '0', fontSize: '16px' }}>
            {errors.submit}
          </p>
        </div>
      )}

      {/* Form */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              color: '#2c3e50',
              margin: '0 0 20px 0',
              fontSize: '1.3rem',
              fontWeight: '600',
              borderBottom: '2px solid #eee',
              paddingBottom: '10px'
            }}>
              🏪 Basic Information
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter restaurant name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.name ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {errors.name && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Cuisine Type *
                </label>
                <select
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.cuisine ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select cuisine type</option>
                  {cuisines.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
                {errors.cuisine && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    {errors.cuisine}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#2c3e50'
              }}>
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter full address"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: errors.address ? '1px solid #e74c3c' : '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              {errors.address && (
                <div style={{
                  color: '#e74c3c',
                  fontSize: '12px',
                  marginTop: '5px'
                }}>
                  {errors.address}
                </div>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginTop: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.phone ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {errors.phone && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    {errors.phone}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.email ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {errors.email && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    {errors.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              color: '#2c3e50',
              margin: '0 0 20px 0',
              fontSize: '1.3rem',
              fontWeight: '600',
              borderBottom: '2px solid #eee',
              paddingBottom: '10px'
            }}>
              ⏰ Business Details
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Opening Time
                </label>
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Closing Time
                </label>
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.closingTime ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {errors.closingTime && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    {errors.closingTime}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Price Range
                </label>
                <select
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  {priceRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              marginTop: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Capacity (People) *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Enter capacity"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.capacity ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {errors.capacity && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    {errors.capacity}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Number of Tables *
                </label>
                <input
                  type="number"
                  name="numTables"
                  value={formData.numTables}
                  onChange={handleInputChange}
                  placeholder="Enter number of tables"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.numTables ? '1px solid #e74c3c' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {errors.numTables && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    {errors.numTables}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c3e50'
                }}>
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  placeholder="Enter rating"
                  min="0"
                  max="5"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              color: '#2c3e50',
              margin: '0 0 20px 0',
              fontSize: '1.3rem',
              fontWeight: '600',
              borderBottom: '2px solid #eee',
              paddingBottom: '10px'
            }}>
              📝 Additional Information
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#2c3e50'
              }}>
                Website URL
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: errors.website ? '1px solid #e74c3c' : '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              {errors.website && (
                <div style={{
                  color: '#e74c3c',
                  fontSize: '12px',
                  marginTop: '5px'
                }}>
                  {errors.website}
                </div>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#2c3e50'
              }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter restaurant description..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔄 Reset Form
            </button>
            
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ➕ Create Restaurant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

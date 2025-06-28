import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function BookingForm({ restaurant, onSubmit }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingDate: '',
    bookingTime: '',
    numGuests: 1,
    tableId: '',
    depositAmount: 0,
    specialRequests: '',
    dietaryRestrictions: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    }

    if (!formData.bookingDate) {
      newErrors.bookingDate = 'Booking date is required';
    } else {
      const selectedDate = new Date(formData.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.bookingDate = 'Booking date cannot be in the past';
      }
    }

    if (!formData.bookingTime) {
      newErrors.bookingTime = 'Booking time is required';
    }

    if (!formData.numGuests || formData.numGuests < 1) {
      newErrors.numGuests = 'Number of guests must be at least 1';
    }

    if (!formData.tableId) {
      newErrors.tableId = 'Please select a table';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Booking form error:', error);
      setErrors({ submit: 'Failed to create booking. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 11; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const generateTableOptions = () => {
    if (!restaurant || !restaurant.tables) return [];
    return restaurant.tables.map(table => ({
      value: table.id,
      label: `Table ${table.id} (${table.capacity} seats)`
    }));
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ 
        fontSize: '1.8rem', 
        color: '#2c3e50', 
        margin: '0 0 30px 0',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        📝 Booking Form
      </h2>

      {/* Restaurant Info */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px'
      }}>
        <h3 style={{ 
          fontSize: '1.3rem', 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontWeight: '600'
        }}>
          {restaurant.name}
        </h3>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0 0 5px 0',
          fontSize: '14px'
        }}>
          📍 {restaurant.address}
        </p>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0',
          fontSize: '14px'
        }}>
          📞 {restaurant.phone}
        </p>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* Customer Name */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.customerName ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter customer name"
            />
            {errors.customerName && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.customerName}
              </div>
            )}
          </div>

          {/* Customer Email */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Email *
            </label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.customerEmail ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter email address"
            />
            {errors.customerEmail && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.customerEmail}
              </div>
            )}
          </div>

          {/* Customer Phone */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.customerPhone ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter phone number"
            />
            {errors.customerPhone && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.customerPhone}
              </div>
            )}
          </div>

          {/* Number of Guests */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Number of Guests *
            </label>
            <select
              name="numGuests"
              value={formData.numGuests}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.numGuests ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'person' : 'people'}
                </option>
              ))}
            </select>
            {errors.numGuests && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.numGuests}
              </div>
            )}
          </div>

          {/* Booking Date */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Booking Date *
            </label>
            <input
              type="date"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.bookingDate ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {errors.bookingDate && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.bookingDate}
              </div>
            )}
          </div>

          {/* Booking Time */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Booking Time *
            </label>
            <select
              name="bookingTime"
              value={formData.bookingTime}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.bookingTime ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select time</option>
              {generateTimeSlots().map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.bookingTime && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.bookingTime}
              </div>
            )}
          </div>

          {/* Table Selection */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Table Selection *
            </label>
            <select
              name="tableId"
              value={formData.tableId}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.tableId ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select a table</option>
              {generateTableOptions().map(table => (
                <option key={table.value} value={table.value}>
                  {table.label}
                </option>
              ))}
            </select>
            {errors.tableId && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                {errors.tableId}
              </div>
            )}
          </div>

          {/* Deposit Amount */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Deposit Amount (฿)
            </label>
            <input
              type="number"
              name="depositAmount"
              value={formData.depositAmount}
              onChange={handleInputChange}
              min="0"
              step="100"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter deposit amount"
            />
          </div>
        </div>

        {/* Special Requests */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Special Requests
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleInputChange}
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
            placeholder="Any special requests or preferences..."
          />
        </div>

        {/* Dietary Restrictions */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Dietary Restrictions
          </label>
          <textarea
            name="dietaryRestrictions"
            value={formData.dietaryRestrictions}
            onChange={handleInputChange}
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
            placeholder="Any dietary restrictions or allergies..."
          />
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '15px 40px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Booking...' : '📅 Create Booking'}
          </button>
        </div>
      </form>

      {/* Booking Information */}
      <div style={{
        background: '#e8f4fd',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '30px'
      }}>
        <h4 style={{ 
          fontSize: '1.1rem', 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontWeight: '600'
        }}>
          ℹ️ Booking Information
        </h4>
        <ul style={{ 
          margin: '0', 
          padding: '0 0 0 20px',
          color: '#7f8c8d',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <li>You will receive a confirmation via LINE and email</li>
          <li>Please arrive 5 minutes before your booking time</li>
          <li>Contact the restaurant directly for any changes</li>
          <li>Deposit may be required for large groups</li>
        </ul>
      </div>
    </div>
  );
}

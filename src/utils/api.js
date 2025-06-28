const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
};

// Authentication API
export const authAPI = {
  // LINE Login
  lineLogin: async (code) => {
    const response = await fetch(`${API_BASE_URL}/auth/line`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return handleResponse(response);
  },

  // Logout
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  // Get LINE OA ID
  getLineOAId: async () => {
    const response = await fetch(`${API_BASE_URL}/line-oa-id`);
    return handleResponse(response);
  }
};

// Restaurant API
export const restaurantAPI = {
  // Get all restaurants
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/restaurants`);
    return handleResponse(response);
  },

  // Get restaurant by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
    return handleResponse(response);
  },

  // Create restaurant (admin only)
  create: async (restaurantData) => {
    const response = await fetch(`${API_BASE_URL}/restaurants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(restaurantData)
    });
    return handleResponse(response);
  },

  // Update restaurant (admin only)
  update: async (id, restaurantData) => {
    const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(restaurantData)
    });
    return handleResponse(response);
  },

  // Delete restaurant (admin only)
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Booking API
export const bookingAPI = {
  // Create booking
  create: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    return handleResponse(response);
  },

  // Get booking history
  getHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/history`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get booking by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Cancel booking
  cancel: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Check-in booking
  checkin: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/checkin`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Admin API
export const adminAPI = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get all bookings
  getAllBookings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/bookings?${queryString}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update booking status
  updateBookingStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  // Get all users
  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/users?${queryString}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Set token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Remove token
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Handle API errors
  handleError: (error) => {
    console.error('API Error:', error);
    
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      apiUtils.clearAuth();
      window.location.href = '/login';
    }
    
    return error.message || 'An error occurred';
  }
};

// Export all APIs
export default {
  auth: authAPI,
  restaurant: restaurantAPI,
  booking: bookingAPI,
  admin: adminAPI,
  utils: apiUtils
};

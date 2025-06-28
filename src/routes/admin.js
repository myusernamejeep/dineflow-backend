const Router = require('koa-router');
const { 
  getDashboardStats, 
  getAllBookings, 
  updateBookingStatus, 
  getAllUsers 
} = require('../controllers/adminController');

const router = new Router({ prefix: '/api/admin' });

// Dashboard analytics
router.get('/dashboard', getDashboardStats);

// Booking management
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);

// User management
router.get('/users', getAllUsers);

module.exports = router;

const Router = require('koa-router');
const { createBooking, getBookingHistory, cancelBooking, checkinBooking, getBookingById } = require('../controllers/bookingController');
const router = new Router({ prefix: '/api' });

router.post('/bookings', createBooking);
router.get('/bookings/history', getBookingHistory);
router.get('/bookings/:id', getBookingById);
router.post('/bookings/:id/cancel', cancelBooking);
router.post('/bookings/:id/checkin', checkinBooking);

module.exports = router;

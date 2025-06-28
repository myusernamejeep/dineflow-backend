const Router = require('@koa/router');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../utils/auth');
const { adminOnly } = require('../utils/authGuard');
const rateLimit = require('koa-ratelimit');

const router = new Router({
  prefix: '/api/reviews'
});

// Rate limiting for review creation
const reviewRateLimit = rateLimit({
  driver: 'memory',
  db: new Map(),
  duration: 60000, // 1 minute
  max: 3, // 3 reviews per minute
  errorMessage: 'Too many review submissions, please try again later.',
  id: (ctx) => ctx.state.user.id,
  headers: {
    'X-RateLimit-Limit': 'max',
    'X-RateLimit-Remaining': 'remaining',
    'X-RateLimit-Reset': 'reset'
  }
});

// Public routes
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);
router.get('/stats/:restaurantId', reviewController.getReviewStats);
router.get('/:id', reviewController.getReview);

// User routes (authenticated)
router.use(authenticate);

// Review management
router.post('/', reviewRateLimit, reviewController.createReview);
router.get('/user/reviews', reviewController.getUserReviews);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Review interactions
router.post('/:id/helpful', reviewController.markHelpful);
router.delete('/:id/helpful', reviewController.removeHelpful);
router.post('/:id/flag', reviewController.flagReview);

// Admin routes
router.use('/admin', adminOnly);

// Moderation
router.get('/admin/pending', reviewController.getPendingReviews);
router.get('/admin/flagged', reviewController.getFlaggedReviews);
router.post('/admin/:id/approve', reviewController.approveReview);
router.post('/admin/:id/reject', reviewController.rejectReview);
router.post('/admin/:id/flags/:flagIndex/resolve', reviewController.resolveFlag);

module.exports = router; 
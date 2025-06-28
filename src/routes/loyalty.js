const Router = require('@koa/router');
const loyaltyController = require('../controllers/loyaltyController');
const { authenticate } = require('../utils/auth');
const rateLimit = require('koa-ratelimit');

const router = new Router({
  prefix: '/api/loyalty'
});

// Rate limiting for loyalty actions
const loyaltyRateLimit = rateLimit({
  driver: 'memory',
  db: new Map(),
  duration: 60000, // 1 minute
  max: 10, // 10 actions per minute
  errorMessage: 'Too many loyalty actions, please try again later.',
  id: (ctx) => ctx.state.user.id,
  headers: {
    'X-RateLimit-Limit': 'max',
    'X-RateLimit-Remaining': 'remaining',
    'X-RateLimit-Reset': 'reset'
  }
});

// All loyalty routes require authentication
router.use(authenticate);

// Account management
router.get('/account', loyaltyController.getLoyaltyAccount);
router.put('/preferences', loyaltyController.updatePreferences);

// Points earning
router.post('/points/booking', loyaltyRateLimit, loyaltyController.awardBookingPoints);
router.post('/points/review', loyaltyRateLimit, loyaltyController.awardReviewPoints);
router.post('/points/checkin', loyaltyRateLimit, loyaltyController.awardCheckinPoints);
router.post('/points/referral', loyaltyRateLimit, loyaltyController.awardReferralPoints);

// Rewards
router.get('/rewards', loyaltyController.getAvailableRewards);
router.post('/rewards/redeem', loyaltyRateLimit, loyaltyController.redeemReward);
router.get('/rewards/redeemed', loyaltyController.getRedeemedRewards);

// Challenges
router.get('/challenges', loyaltyController.getChallenges);
router.post('/challenges/claim', loyaltyRateLimit, loyaltyController.claimChallengeReward);

// History and analytics
router.get('/history', loyaltyController.getPointsHistory);
router.get('/leaderboard', loyaltyController.getLeaderboard);

module.exports = router; 
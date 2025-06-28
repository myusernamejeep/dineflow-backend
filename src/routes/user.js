const Router = require('koa-router');
const { 
  lineLogin, 
  getProfile, 
  updateProfile, 
  logout, 
  getLineOAId 
} = require('../controllers/userController');

const router = new Router({ prefix: '/api' });

// Authentication routes
router.post('/auth/line', lineLogin);
router.post('/auth/logout', logout);

// User profile routes
router.get('/me', getProfile);
router.put('/me', updateProfile);

// LINE OA configuration
router.get('/line-oa-id', getLineOAId);

module.exports = router;

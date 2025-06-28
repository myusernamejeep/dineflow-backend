const Router = require('koa-router');
const { 
  getAllRestaurants, 
  getRestaurantById, 
  createRestaurant, 
  updateRestaurant, 
  deleteRestaurant 
} = require('../controllers/restaurantController');

const router = new Router({ prefix: '/api' });

// Public routes
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurantById);

// Admin routes
router.post('/restaurants', createRestaurant);
router.put('/restaurants/:id', updateRestaurant);
router.delete('/restaurants/:id', deleteRestaurant);

module.exports = router;

const Restaurant = require('../models/Restaurant');

exports.getAllRestaurants = async ctx => {
  try {
    const restaurants = await Restaurant.find({ isActive: true })
      .select('name address cuisine priceRange rating imageUrl')
      .sort({ rating: -1 });

    ctx.body = { 
      success: true, 
      restaurants 
    };
  } catch (error) {
    console.error('Get restaurants error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.getRestaurantById = async ctx => {
  try {
    const { id } = ctx.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      ctx.status = 404;
      ctx.body = { error: 'Restaurant not found' };
      return;
    }

    ctx.body = { 
      success: true, 
      restaurant 
    };
  } catch (error) {
    console.error('Get restaurant error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.createRestaurant = async ctx => {
  try {
    const user = ctx.state.user;
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    const {
      name,
      address,
      phone,
      cuisine,
      priceRange,
      description,
      imageUrl,
      openingHours,
      tables
    } = ctx.request.body;

    if (!name || !address || !phone) {
      ctx.status = 400;
      ctx.body = { error: 'Missing required fields' };
      return;
    }

    const restaurant = new Restaurant({
      name,
      address,
      phone,
      cuisine: cuisine || 'General',
      priceRange: priceRange || '$$',
      description: description || '',
      imageUrl: imageUrl || '',
      openingHours: openingHours || {},
      tables: tables || [],
      rating: 0,
      isActive: true
    });

    await restaurant.save();

    ctx.status = 201;
    ctx.body = { 
      success: true, 
      restaurant,
      message: 'Restaurant created successfully' 
    };
  } catch (error) {
    console.error('Create restaurant error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.updateRestaurant = async ctx => {
  try {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      ctx.status = 404;
      ctx.body = { error: 'Restaurant not found' };
      return;
    }

    const updateData = ctx.request.body;
    Object.assign(restaurant, updateData);
    await restaurant.save();

    ctx.body = { 
      success: true, 
      restaurant,
      message: 'Restaurant updated successfully' 
    };
  } catch (error) {
    console.error('Update restaurant error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.deleteRestaurant = async ctx => {
  try {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      ctx.status = 404;
      ctx.body = { error: 'Restaurant not found' };
      return;
    }

    restaurant.isActive = false;
    await restaurant.save();

    ctx.body = { 
      success: true, 
      message: 'Restaurant deleted successfully' 
    };
  } catch (error) {
    console.error('Delete restaurant error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
}; 
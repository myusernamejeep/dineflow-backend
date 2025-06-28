const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const mongoose = require('mongoose');
const { authMiddleware, optionalAuthMiddleware } = require('./utils/auth');

// Import routes
const bookingRoutes = require('./routes/booking');
const restaurantRoutes = require('./routes/restaurant');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/reviews');
const reviewAnalyticsRoutes = require('./routes/reviewAnalytics');

const app = new Koa();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser());

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Server error:', err);
    ctx.status = err.status || 500;
    ctx.body = { 
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
  }
});

// Apply auth middleware to protected routes
app.use(async (ctx, next) => {
  // Public routes that don't need authentication
  const publicRoutes = [
    '/api/restaurants',
    '/api/auth/line',
    '/api/line-oa-id',
    '/api/reviews/restaurant',
    '/api/reviews/stats'
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    ctx.path.startsWith(route) && ctx.method === 'GET'
  );
  
  if (isPublicRoute) {
    await optionalAuthMiddleware(ctx, next);
  } else {
    await authMiddleware(ctx, next);
  }
});

// Routes
app.use(bookingRoutes.routes());
app.use(restaurantRoutes.routes());
app.use(adminRoutes.routes());
app.use(userRoutes.routes());
app.use(reviewRoutes.routes());
app.use(reviewAnalyticsRoutes.routes());

// Health check endpoint
app.use(async (ctx) => {
  if (ctx.path === '/health') {
    ctx.body = { status: 'OK', timestamp: new Date().toISOString() };
  }
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Koa server running on port ${port}`);
    console.log(`📊 MongoDB connected: ${process.env.MONGODB_URI}`);
    console.log(`⭐ Review system enabled`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

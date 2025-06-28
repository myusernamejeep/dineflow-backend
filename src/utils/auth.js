const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT middleware for Koa.js
exports.authMiddleware = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: 'No token provided' };
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Invalid token' };
      return;
    }

    ctx.state.user = user;
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
  }
};

// Optional auth middleware (doesn't fail if no token)
exports.optionalAuthMiddleware = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        ctx.state.user = user;
      }
    }
    
    await next();
  } catch (error) {
    // Continue without authentication
    await next();
  }
};

// Get user from token (for frontend use)
exports.getUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Set token in localStorage
exports.setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
exports.removeToken = () => {
  localStorage.removeItem('token');
};

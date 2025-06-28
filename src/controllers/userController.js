const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.lineLogin = async ctx => {
  try {
    const { code } = ctx.request.body;
    
    if (!code) {
      ctx.status = 400;
      ctx.body = { error: 'Authorization code required' };
      return;
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_REDIRECT_URI,
        client_id: process.env.LINE_CHANNEL_ID,
        client_secret: process.env.LINE_CHANNEL_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      ctx.status = 400;
      ctx.body = { error: 'Failed to get access token' };
      return;
    }

    // Get user profile from LINE
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();
    
    // Find or create user
    let user = await User.findOne({ lineUserId: profileData.userId });
    
    if (!user) {
      user = new User({
        lineUserId: profileData.userId,
        displayName: profileData.displayName,
        pictureUrl: profileData.pictureUrl,
        email: profileData.email || '',
        isAdmin: false
      });
      await user.save();
    } else {
      // Update existing user info
      user.displayName = profileData.displayName;
      user.pictureUrl = profileData.pictureUrl;
      if (profileData.email) user.email = profileData.email;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, lineUserId: user.lineUserId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    ctx.body = {
      success: true,
      token,
      user: {
        _id: user._id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email,
        isAdmin: user.isAdmin
      }
    };
  } catch (error) {
    console.error('LINE login error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.getProfile = async ctx => {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not authenticated' };
      return;
    }

    ctx.body = {
      success: true,
      user: {
        _id: user._id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email,
        isAdmin: user.isAdmin,
        lineUserId: user.lineUserId
      }
    };
  } catch (error) {
    console.error('Get profile error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.updateProfile = async ctx => {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not authenticated' };
      return;
    }

    const { displayName, email } = ctx.request.body;
    
    if (displayName) user.displayName = displayName;
    if (email) user.email = email;
    
    await user.save();

    ctx.body = {
      success: true,
      user: {
        _id: user._id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email,
        isAdmin: user.isAdmin
      },
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Update profile error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.logout = async ctx => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token. Server-side, we could blacklist the token
    // if needed for additional security.
    
    ctx.body = {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.getLineOAId = async ctx => {
  try {
    // Return LINE OA ID for frontend to use in add friend button
    ctx.body = {
      success: true,
      lineOAId: process.env.LINE_OA_ID || 'YOUR_LINE_OA_ID'
    };
  } catch (error) {
    console.error('Get LINE OA ID error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
}; 
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

exports.getDashboardStats = async ctx => {
  try {
    const user = ctx.state.user;
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    // Get date range for analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total bookings
    const totalBookings = await Booking.countDocuments();
    const recentBookings = await Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Revenue calculations
    const allBookings = await Booking.find({ paymentStatus: 'paid' });
    const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.depositAmount || 0), 0);
    
    const recentPaidBookings = await Booking.find({ 
      paymentStatus: 'paid', 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const recentRevenue = recentPaidBookings.reduce((sum, booking) => sum + (booking.depositAmount || 0), 0);

    // Status breakdown
    const statusBreakdown = await Booking.aggregate([
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } }
    ]);

    // Check-in rate
    const checkedInBookings = await Booking.countDocuments({ bookingStatus: 'checked-in' });
    const checkInRate = totalBookings > 0 ? (checkedInBookings / totalBookings * 100).toFixed(1) : 0;

    // Cancel rate
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });
    const cancelRate = totalBookings > 0 ? (cancelledBookings / totalBookings * 100).toFixed(1) : 0;

    // Top restaurants by bookings
    const topRestaurants = await Booking.aggregate([
      { $group: { _id: '$restaurantId', bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' }
    ]);

    // Daily booking trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyTrends = await Booking.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    ctx.body = {
      success: true,
      stats: {
        totalBookings,
        recentBookings,
        totalRevenue,
        recentRevenue,
        statusBreakdown,
        checkInRate,
        cancelRate,
        topRestaurants,
        dailyTrends
      }
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.getAllBookings = async ctx => {
  try {
    const user = ctx.state.user;
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    const { page = 1, limit = 20, status, restaurantId } = ctx.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.bookingStatus = status;
    if (restaurantId) query.restaurantId = restaurantId;

    const bookings = await Booking.find(query)
      .populate('restaurantId', 'name address')
      .populate('user', 'displayName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    ctx.body = {
      success: true,
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get all bookings error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.updateBookingStatus = async ctx => {
  try {
    const { id } = ctx.params;
    const { status } = ctx.request.body;
    const user = ctx.state.user;
    
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    const booking = await Booking.findById(id)
      .populate('restaurantId', 'name')
      .populate('user', 'lineUserId displayName');

    if (!booking) {
      ctx.status = 404;
      ctx.body = { error: 'Booking not found' };
      return;
    }

    booking.bookingStatus = status;
    
    if (status === 'checked-in') {
      booking.checkedInAt = new Date();
      booking.qrCheckedIn = true;
    } else if (status === 'cancelled') {
      booking.cancelledAt = new Date();
    }

    await booking.save();

    // Send notification via LINE
    if (booking.user.lineUserId) {
      const statusMessages = {
        'confirmed': '✅ การจองได้รับการยืนยันแล้ว',
        'cancelled': '❌ การจองถูกยกเลิก',
        'checked-in': '✅ เช็คอินสำเร็จ',
        'no-show': '⚠️ ไม่มาสัมมนา'
      };
      
      const message = statusMessages[status] || `สถานะการจอง: ${status}`;
      await require('../utils/notify').sendLineMessage(booking.user.lineUserId,
        `${message}\nร้าน: ${booking.restaurantId.name}\nวันที่: ${booking.bookingDate}\nเวลา: ${booking.bookingTime}`
      );
    }

    ctx.body = {
      success: true,
      booking,
      message: 'Booking status updated successfully'
    };
  } catch (error) {
    console.error('Update booking status error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.getAllUsers = async ctx => {
  try {
    const user = ctx.state.user;
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    const { page = 1, limit = 20 } = ctx.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments();

    ctx.body = {
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get all users error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
}; 
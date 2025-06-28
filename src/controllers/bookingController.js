const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { sendLineMessage, sendEmail } = require('../utils/notify');

exports.createBooking = async ctx => {
  try {
    const {
      restaurantId,
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      bookingTime,
      numGuests,
      tableId,
      depositAmount,
      specialRequests,
      dietaryRestrictions
    } = ctx.request.body;

    // Validate required fields
    if (!restaurantId || !customerName || !customerEmail || !bookingDate || !bookingTime || !numGuests) {
      ctx.status = 400;
      ctx.body = { error: 'Missing required fields' };
      return;
    }

    // Get user from session/token (assuming auth middleware sets ctx.state.user)
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not authenticated' };
      return;
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      ctx.status = 404;
      ctx.body = { error: 'Restaurant not found' };
      return;
    }

    // Create booking
    const booking = new Booking({
      restaurantId,
      user: user._id,
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      bookingTime,
      numGuests,
      tableId,
      depositAmount,
      specialRequests: specialRequests || '',
      dietaryRestrictions: dietaryRestrictions || ''
    });

    await booking.save();

    // Send notification via LINE Messaging API
    if (user.lineUserId) {
      await sendLineMessage(user.lineUserId, 
        `✅ จองโต๊ะสำเร็จ!\nร้าน: ${restaurant.name}\nวันที่: ${bookingDate}\nเวลา: ${bookingTime}\nจำนวนคน: ${numGuests} คน\nสถานะ: รอการยืนยัน`
      );
    }

    // Send email confirmation
    await sendEmail(customerEmail, 'Booking Confirmation', 
      `Your booking has been created successfully. Booking ID: ${booking._id}`);

    ctx.status = 201;
    ctx.body = { 
      success: true, 
      booking,
      message: 'Booking created successfully' 
    };
  } catch (error) {
    console.error('Create booking error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.getBookingHistory = async ctx => {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not authenticated' };
      return;
    }

    const bookings = await Booking.find({ user: user._id })
      .populate('restaurantId', 'name address')
      .sort({ createdAt: -1 });

    ctx.body = { 
      success: true, 
      bookings 
    };
  } catch (error) {
    console.error('Get booking history error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.cancelBooking = async ctx => {
  try {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not authenticated' };
      return;
    }

    const booking = await Booking.findOne({ _id: id, user: user._id })
      .populate('restaurantId', 'name');

    if (!booking) {
      ctx.status = 404;
      ctx.body = { error: 'Booking not found' };
      return;
    }

    if (booking.bookingStatus === 'cancelled') {
      ctx.status = 400;
      ctx.body = { error: 'Booking already cancelled' };
      return;
    }

    if (booking.bookingStatus === 'checked-in') {
      ctx.status = 400;
      ctx.body = { error: 'Cannot cancel checked-in booking' };
      return;
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Send cancellation notification via LINE
    if (user.lineUserId) {
      await sendLineMessage(user.lineUserId,
        `❌ ยกเลิกการจอง\nร้าน: ${booking.restaurantId.name}\nวันที่: ${booking.bookingDate}\nเวลา: ${booking.bookingTime}\nสถานะ: ยกเลิกแล้ว`
      );
    }

    // Send email cancellation
    await sendEmail(booking.customerEmail, 'Booking Cancelled',
      `Your booking has been cancelled. Booking ID: ${booking._id}`);

    ctx.body = { 
      success: true, 
      booking,
      message: 'Booking cancelled successfully' 
    };
  } catch (error) {
    console.error('Cancel booking error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.checkinBooking = async ctx => {
  try {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not authenticated' };
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

    if (booking.bookingStatus === 'cancelled') {
      ctx.status = 400;
      ctx.body = { error: 'Cannot check-in cancelled booking' };
      return;
    }

    if (booking.bookingStatus === 'checked-in') {
      ctx.status = 400;
      ctx.body = { error: 'Booking already checked-in' };
      return;
    }

    // Update booking status
    booking.bookingStatus = 'checked-in';
    booking.checkedInAt = new Date();
    booking.qrCheckedIn = true;
    await booking.save();

    // Send check-in notification via LINE
    if (booking.user.lineUserId) {
      await sendLineMessage(booking.user.lineUserId,
        `✅ เช็คอินสำเร็จ!\nร้าน: ${booking.restaurantId.name}\nวันที่: ${booking.bookingDate}\nเวลา: ${booking.bookingTime}\nจำนวนคน: ${booking.numGuests} คน\nสถานะ: เช็คอินแล้ว`
      );
    }

    ctx.body = { 
      success: true, 
      booking,
      message: 'Booking checked-in successfully' 
    };
  } catch (error) {
    console.error('Check-in booking error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

exports.getBookingById = async ctx => {
  try {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'User not authenticated' };
      return;
    }

    const booking = await Booking.findOne({ _id: id, user: user._id })
      .populate('restaurantId', 'name address phone');

    if (!booking) {
      ctx.status = 404;
      ctx.body = { error: 'Booking not found' };
      return;
    }

    ctx.body = { 
      success: true, 
      booking 
    };
  } catch (error) {
    console.error('Get booking error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
};

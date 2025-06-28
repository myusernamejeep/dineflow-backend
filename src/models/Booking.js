const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  bookingDate: { type: String, required: true },
  bookingTime: { type: String, required: true },
  numGuests: { type: Number, required: true },
  tableId: { type: String, required: true },
  depositAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  bookingStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'no-show', 'checked-in'], default: 'pending' },
  stripePaymentIntentId: String,
  createdAt: { type: Date, default: Date.now },
  qrCheckedIn: { type: Boolean, default: false },
  cancelledAt: Date,
  checkedInAt: Date,
  specialRequests: { type: String, default: '' },
  dietaryRestrictions: { type: String, default: '' }
});
module.exports = mongoose.model('Booking', bookingSchema);

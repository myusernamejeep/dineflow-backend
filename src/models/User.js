const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  lineUserId: { type: String, required: true, unique: true },
  displayName: String,
  email: String,
  pictureUrl: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);

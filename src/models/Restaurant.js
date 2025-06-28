const mongoose = require('mongoose');
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  address: String,
  phone: String,
  image: String,
  depositPerPerson: { type: Number, default: 0 },
  tables: [{
    tableId: { type: String, required: true },
    capacity: { type: Number, required: true },
    type: { type: String, required: true }
  }]
});
module.exports = mongoose.model('Restaurant', restaurantSchema);

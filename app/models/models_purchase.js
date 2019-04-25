const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = mongoose.Schema.Types.ObjectId;

const purchase = new Schema({
  sku: Number,
  phone: String,
  userId: String,
  timestamp: Date,
  coordinates: Object
});

module.exports = mongoose.model('Purchase', purchase, 'purchases');

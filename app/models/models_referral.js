const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = mongoose.Schema.Types.ObjectId;

const referral = new Schema({
  emitter: String,
  receiver: String
});

module.exports = mongoose.model('Referral', referral, 'referrals');

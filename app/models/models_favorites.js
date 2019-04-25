const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = mongoose.Schema.Types.ObjectId;

const favorite = new Schema({
    sku: Number,
    name: String,
    image: String,
    userId: String,
    timestamp: Date
});

module.exports = mongoose.model('Favorite', favorite, 'favorites');

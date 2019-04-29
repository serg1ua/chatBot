const Favorite = require('../models/models_favorites');
const Purchase = require('../models/models_purchase');


class DB {
  constructor() {}

  // Check if product exists in favorites
  checkFavorite(favorite) {
    const sku = favorite.split('&')[0];
    return Favorite.findOne({ 'sku': sku }).exec();
  }

  // Add new product to favorites
  addNewFavorite(userId, newFavorite, timestamp) {
    const items = newFavorite.split('&');
    const favorite = new Favorite();
    favorite.sku = items[0];
    favorite.name = items[1];
    favorite.image = items[2];
    favorite.userId = userId;
    favorite.timestamp = timestamp;
    let promise = favorite.save();
    return promise.then(favorite);
  }

  // Fetch list of favoretes from DB
  getFavorites(userId) {
    return Favorite.find({ 'userId': userId }).sort({ timestamp: 'desc' }).limit(10).exec();
  }

  // Save purchased
  savePurchase(product) {
    const purchase = new Purchase();
    purchase.userId = product.userId;
    purchase.sku = product.sku;
    purchase.phone = product.phone;
    purchase.coordinates = product.coordinates;
    purchase.timestamp = product.timestamp;
    let promise = purchase.save();
    return promise.then(purchase);
  }

  // Fetch purchases
  getPurchases(userId) {
    return Purchase.find({ 'userId': userId }).sort({ timestamp: 'desc' }).limit(10).exec();
  }
}

module.exports = DB;
// exec()

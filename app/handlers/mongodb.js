const Favorite = require('../models/favorites');
const Purchase = require('../models/purchase');
const User = require('../models/user');

class DB {
  // Checks if you already referral
  areYouReferralFirstTime(userId) {
    return User.findOne({ userId: userId });
  }

  // Save new user
  saveNewUser(newUser) {
    const user = new User();
    user.userId = newUser;
    user.referrals = [];
    return user.save();
  }

  // Save to referrals
  pushToReferrals(refEmitterId, newUserId) {
    return User.updateOne({ userId: refEmitterId }, { $addToSet: { referrals: newUserId } });
  }

  // Get referral users
  getReferrals(userId) {
    return User.findOne({ userId: userId }, { referrals: 1 });
  }

  // Check if product exists in favorites
  checkFavorite(userId, item) {
    const sku = item.split('&')[0];
    return Favorite.findOne({ userId: userId, sku: sku });
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
    return favorite.save();
  }

  // Fetch list of favoretes from DB
  getFavorites(userId, pageNumber) {
    return Favorite.find({ userId: userId }).sort({ timestamp: 'desc' }).skip((pageNumber - 1) * 10).limit(10);
  }

  // Save purchased
  savePurchase(product) {
    const purchase = new Purchase();
    purchase.userId = product.userId;
    purchase.sku = product.sku;
    purchase.phone = product.phone;
    purchase.coordinates = product.coordinates;
    purchase.timestamp = product.timestamp;
    return purchase.save();
  }

  // Fetch purchases
  getPurchases(userId, prchOffset) {
    return Purchase.find({ userId: userId }).sort({ timestamp: 'desc' }).skip(prchOffset).limit(8);
  }
}

module.exports = DB;

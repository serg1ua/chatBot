const Favorite = require('../models/models_favorites');
const Purchase = require('../models/models_purchase');
const User = require('../models/models_user');

class DB {
  constructor() {}

  // Checks if you already referral
  areYouReferralFirstTime(userId) {
    return User.findOne({ 'userId': userId })
      .then(user => user)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Save new user
  saveNewUser(newUser) {
    const user = new User();
    user.userId = newUser;
    user.referrals = [];
    return user.save()
      .then(user => user)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Save to referrals
  pushToReferrals(refEmitterId, newUserId) {
    return User.updateOne({ 'userId': refEmitterId }, { $addToSet: { 'referrals': newUserId } })
      .then(result => result)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Get referral users
  getReferrals(userId) {
    return User.findOne({ 'userId': userId }, { 'referrals': 1 })
      .then(referrals => referrals)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Check if product exists in favorites
  checkFavorite(userId, item) {
    const sku = item.split('&')[0];
    return Favorite.findOne({ 'userId': userId, 'sku': sku })
      .then(favorite => favorite)
      .catch(error => {
        console.log(error);
        return error;
      });
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
    return favorite.save()
      .then(favorite => favorite)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Fetch list of favoretes from DB
  getFavorites(userId) {
    return Favorite.find({ 'userId': userId }).sort({ timestamp: 'desc' }).limit(10)
      .then(favorites => favorites)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Save purchased
  savePurchase(product) {
    const purchase = new Purchase();
    purchase.userId = product.userId;
    purchase.sku = product.sku;
    purchase.phone = product.phone;
    purchase.coordinates = product.coordinates;
    purchase.timestamp = product.timestamp;
    return purchase.save()
      .then(purchase => purchase)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Fetch purchases
  getPurchases(userId) {
    return Purchase.find({ 'userId': userId }).sort({ timestamp: 'desc' }).limit(10)
      .then(purchases => purchases)
      .catch(error => {
        console.log(error);
        return error;
      });
  }
}

module.exports = DB;

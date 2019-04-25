// BestBuy API handler

const bby = require('bestbuy')(process.env.BEST_BUY_API_KEY);
require('dotenv').config();

class BestBuy {

  // Fetch categories catalog
  getCatalog() {
    return new Promise((resolve, reject) => {
      bby.categories('', { show: 'all' })
        .then(data => {
          resolve(data);
          reject({ error: 'error' });
        });
    });
  }

  // Fetch products
  getProducts() {
    return new Promise((resolve, reject) => {
      bby.products('', { show: 'all' })
        .then(data => {
          resolve(data);
          reject({ error: 'error' });
        });
    });
  }

  // Fetch products from catalog
  getProductsFromCatalog(abcat) {
    return new Promise((resolve, reject) => {
      bby.products(`categoryPath.id=${abcat}`, { show: 'all' })
        .then(data => {
          resolve(data);
          reject({ error: 'error' });
        });
    });
  }

  // Fetch product
  getProductDetales(sku) {
    return new Promise((resolve, reject) => {
      console.log(sku);
      bby.products(+sku, { show: 'all' })
        .then(data => {
          resolve(data);
          reject({ error: 'error' });
        });
    });
  }
}

module.exports = BestBuy;
// https://bestbuyapis.github.io/api-documentation/#retrieving-collections

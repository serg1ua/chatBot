// BestBuy API handler

const bby = require('bestbuy')(process.env.BEST_BUY_API_KEY);
require('dotenv').config();

function BestBuy() {

  // Fetch categories catalog
  this.getCatalog = () => new Promise((resolve, reject) => {
    bby.categories('', { show: 'all' })
      .then(data => {
        resolve(data);
        reject({ error: 'error' });
      });
  });

  // Fetch products
  this.getProducts = () => new Promise((resolve, reject) => {
    bby.products('', { show: 'all' })
      .then(data => {
        resolve(data);
        reject({ error: 'error' });
      });
  });

  // Fetch products from catalog
  this.getProductsFromCatalog = (abcat) => new Promise((resolve, reject) => {
    bby.products(`categoryPath.id=${abcat}`, { show: 'all' })
      .then(data => {
        resolve(data);
        reject({ error: 'error' });
      });
  });
}

module.exports = BestBuy;
// https://bestbuyapis.github.io/api-documentation/#retrieving-collections

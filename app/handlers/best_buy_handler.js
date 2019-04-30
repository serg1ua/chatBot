// BestBuy API handler
const bby = require('bestbuy')(process.env.BEST_BUY_API_KEY);
require('dotenv').config();

class BestBuy {

  // Fetch categories catalog
  getCatalog(page) {
    return new Promise((resolve, reject) => {
      bby.categories('', { show: 'all', page: page, pageSize: 8 })
        .then(data => resolve(data))
        .catch(error => console.log(`BESTBUY ERROR ${error.status} ${error.statusText}`));
    });
  }

  // Fetch products
  getProducts(keyword, page) {
    let key = '';
    if (keyword) {
      key = `search=${keyword}`;
    }
    return new Promise((resolve, reject) => {
      bby.products(key, { show: 'all', page: page, pageSize: 10 })
        .then(data => resolve(data))
        .catch(error => console.log(`BESTBUY ERROR ${error.status} ${error.statusText}`));
    });
  }

  // Fetch products from catalog
  getProductsFromCatalog(abcat) {
    return new Promise((resolve, reject) => {
      bby.products(`categoryPath.id=${abcat}`, { show: 'all' })
        .then(data => resolve(data))
        .catch(error => console.log(`BESTBUY ERROR ${error.status} ${error.statusText}`));
    });
  }

  // Fetch product
  getProductDetales(sku) {
    return new Promise((resolve, reject) => {
      bby.products(+sku, { show: 'all' })
        .then(data => resolve(data))
        .catch(error => console.log(`BESTBUY ERROR ${error.status} ${error.statusText}`));
    });
  }
}

module.exports = BestBuy;
// https://bestbuyapis.github.io/api-documentation/#retrieving-collection
// https://www.messenger.com/t/324350831773474

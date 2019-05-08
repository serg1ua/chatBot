// BestBuy API handler
const bby = require('bestbuy')(process.env.BEST_BUY_API_KEY);
require('dotenv').config();

class BestBuy {

  // Fetch categories catalog
  getCatalog(page) {
    return bby.categories('', { show: 'all', page: page, pageSize: 8 })
      .then(data => data)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Fetch products
  getProducts(keyword, page) {
    let key = '';
    if (keyword) {
      key = `search=${keyword}`;
    }
    return bby.products(key, { show: 'all', page: page, pageSize: 10 })
      .then(data => data)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Fetch products from catalog
  getProductsFromCatalog(abcat) {
    return bby.products(`categoryPath.id=${abcat}`, { show: 'all' })
      .then(data => data)
      .catch(error => {
        console.log(error);
        return error;
      });
  }

  // Fetch product
  getProductDetales(sku) {
    return bby.products(+sku, { show: 'all' })
      .then(data => data)
      .catch(error => {
        console.log(error);
        return error;
      });
  }
}

module.exports = BestBuy;

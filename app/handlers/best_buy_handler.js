// BestBuy API handler

var rp = require('request-promise');
require('dotenv').config();

var catalogURI = "https://api.bestbuy.com/v1/categories?format=json&show=all&apiKey=" + process.env.BEST_BUY_API_KEY;

// Fetch categories catalog
function BestBuy() {
  this.getCatalog = () => new Promise((resolve, reject) => {
    rp(getCatalogOpts(catalogURI))
      .then(data => {
        resolve(data);
        reject({ error: 'error' });
      });
  });
}

// Mastering opts for catalog
function getCatalogOpts(uri) {
  var opts = {
    uri: uri,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };
  return opts;
}

module.exports = BestBuy;

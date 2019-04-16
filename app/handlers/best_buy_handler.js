// BestBuy API handler

var rp = require('request-promise');
require('dotenv').config();

var catalogURI = "https://api.bestbuy.com/v1/categories?format=json&show=id&apiKey=" + process.env.BEST_BUY_API_KEY;

// Fetching BestBuy catalog
exports.getCatalog = function () {
  var options = {
    uri: catalogURI,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  rp(options)
    .then(function (catalog) {
      console.log(catalog);
    })
    .catch(function (err) {
      console.log(err);
    });
};

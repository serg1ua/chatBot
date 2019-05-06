///// Error helper class /////

class ErrorHelpers {

  // Db error helper
  dbError(data) {
    return `Error occurred while processing your request!\nERROR ${data.code} ${data.errmsg}`;
  }

  // BestBuy error helper
  bestBuyError(data) {
    return `Error occurred while processing your request\nERROR ${data.data.error.status}`;
  }
}

module.exports = ErrorHelpers;

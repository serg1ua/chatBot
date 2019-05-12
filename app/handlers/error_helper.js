///// Error helper class /////

class ErrorHelpers {

  // Db error helper
  dbError(error) {
    console.log(error);
    return `Error occurred while processing your request!\nERROR ${error.code} ${error.errmsg}`;
  }

  // BestBuy error helper
  bestBuyError(error) {
    console.log(error);
    return `Error occurred while processing your request\nERROR ${error.status} ${error.statusText}`;
  }
}

module.exports = ErrorHelpers;

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

// var webhooks = require('./app/routes/webhooks');

function webserver(controller) {

  // Create express server
  var app = express();

  // Seting middleware
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  // Setting view engine and path
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // // Setting webhook route
  // app.use('/', webhooks)(app, controller);

  var listener = app.listen(process.env.PORT || '3000', function () {
    console.log('Your app is listening on port ' + listener.address().port);
  });

  // import all the pre-defined routes that are present in /components/routes
  var normalizedPath = require("path").join(__dirname, "app/routes");
  require("fs").readdirSync(normalizedPath).forEach(function (file) {
    require('./app/routes/' + file)(app, controller);
  });

  controller.webserver = app;
  return app;
}

module.exports = webserver;

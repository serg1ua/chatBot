const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();

const test = require('./app/route');

mongoose.connect(process.env.MONGO_DB_URI, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(this, 'connection error:'));
db.once('open', function () {
  console.log('successfully connected to DB');
});

function webserver(controller) {

  // Create express server
  const app = express();

  // Seting middleware
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  // Setting view engine and path
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // test
  app.use('/', test);

  const listener = app.listen(process.env.PORT || '3000', function () {
    console.log('Your app is listening on port ' + listener.address().port);
  });

  // import all the pre-defined routes that are present in /components/routes
  const normalizedPath = require("path").join(__dirname, "app/routes");
  require("fs").readdirSync(normalizedPath).forEach(function (file) {
    require('./app/routes/' + file)(app, controller);
  });

  controller.webserver = app;
  return app;
}

module.exports = webserver;

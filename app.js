const express = require('express');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const https = require('https');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const index = require('./app/route');
const logger = require('./utils/logger');

mongoose.connect(process.env.MONGO_DB_URI, {
  useNewUrlParser: true
});
const db = mongoose.connection;
db.on('error', error => logger.error(error.name));
db.once('open', () => logger.info('connected to mongoDB'));

function webserver(controller) {
  // Create express server
  const app = express();
  // Setting middleware
  app.use(express.json());
  app.use(express.urlencoded({
    extended: false
  }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  // Setting view engine and path
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  // test
  app.use('/', index);
  // Make heroku app no sleep sending request every 15 minutes
  (function() {
    schedule.scheduleJob('*/15 * * * *', () => {
      https.get('https://chat-bot-ua.herokuapp.com/', () => {
        logger.info('chat bot is online');
      }).on('error', (err) => {
        logger.error(`Error: ${err.message}`);
      });
    });
  })();
  const listener = app.listen(process.env.PORT || 3000, () => {
    logger.info(`Your app is listening on port ${listener.address().port} in ${process.env.NODE_ENV}`);
  });

  // import all the pre-defined routes that are present in /components/routes
  const normalizedPath = require('path').join(__dirname, 'app/routes');
  require('fs').readdirSync(normalizedPath).forEach(file => {
    require('./app/routes/' + file)(app, controller);
  });
  controller.webserver = app;
  return app;
}

module.exports = webserver;

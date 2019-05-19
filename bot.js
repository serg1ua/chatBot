const Botkit = require('botkit');
require('dotenv').config();

const logger = require('./utils/logger');

// Check access & verify tokens
if (!process.env.ACCESS_TOKEN) {
  logger.info('Error: Specify a Facebook page_access_token in environment.');
  process.exit(1);
} else {
  logger.info("access_token is OK");
}
if (!process.env.VERIFY_TOKEN) {
  logger.info('Error: Specify a Facebook verify_token in environment.');
  process.exit(1);
}

// Bot creating
const controller = Botkit.facebookbot({
  debug: true,
  receive_via_postback: true,
  require_delivery: true,
  access_token: process.env.ACCESS_TOKEN,
  verify_token: process.env.VERIFY_TOKEN,
});

// Set up an Express-powered webserver
require('./app.js')(controller);

// Subscribe events
require('./app/controllers/bot.subscribe')(controller);

// Thread setup
require('./app/controllers/bot.setup')(controller);

// Routes setup
require('./app/handlers/conversations')(controller);

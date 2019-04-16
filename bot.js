var Botkit = require('botkit');
var request = require('request');
require('dotenv').config();

// Check access & verify tokens
if (!process.env.ACCESS_TOKEN) {
  console.log('Error: Specify a Facebook page_access_token in environment.');
  process.exit(1);
}
else {
  console.log("access_token is OK");
}
if (!process.env.VERIFY_TOKEN) {
  console.log('Error: Specify a Facebook verify_token in environment.');
  process.exit(1);
}

// Bot creating
var controller = Botkit.facebookbot({
  debug: true,
  access_token: process.env.ACCESS_TOKEN,
  verify_token: process.env.VERIFY_TOKEN,
  // storage: db
});

var bot = controller.spawn({});

// Set up an Express-powered webserver
var webserver = require('./app.js')(controller);

// Subscribe events
require('./app/controllers/subscribe_events')(controller);

// Thread setup
require('./app/controllers/bot_setup')(controller);

// Routes setup
require('./app/handlers/bot_handler')(controller);

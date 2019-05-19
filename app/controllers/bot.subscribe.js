const request = require('request');

const logger = require('../../utils/logger');

// Subscribe events
function subscribe(controller) {
  request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + process.env.ACCESS_TOKEN,
    function (err, res, body) {
      if (err) {
        controller.log('Could not subscribe to page messages');
      } else {
        controller.log('Successfully subscribed to Facebook events:', body);
        logger.info('Botkit can now receive messages');

        // start ticking to send conversation messages
        controller.startTicking();
      }
    });
}

module.exports = subscribe;

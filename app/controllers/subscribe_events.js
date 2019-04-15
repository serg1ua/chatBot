var request = require('request');

// Subscribe events
function subscribe(controller) {
  request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + process.env.ACCESS_TOKEN,
    function (err, res, body) {
      if (err) {
        controller.log('Could not subscribe to page messages');
      }
      else {
        controller.log('Successfully subscribed to Facebook events:', body);
        console.log('Botkit can now receive messages');

        // start ticking to send conversation messages
        controller.startTicking(console.log('Teaking'));
      }
    });
}

module.exports = subscribe;

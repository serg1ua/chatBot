// Webhook router
require('dotenv').config();

function webhooks(app, controller) {

  app.get('/webhook', function (req, res) {
    console.log('WEBHOOK_VERIFIED');
    if (req.query['hub.mode'] == 'subscribe') {
      if (req.query['hub.verify_token'] == process.env.VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.send(req.query['hub.challenge']);
      }
      else {
        res.send('OK');
      }
    }
  });

  app.post('/webhook', function (req, res) {

    // Now, pass the webhook into be processed
    var bot = controller.spawn({});
    controller.handleWebhookPayload(req, res, bot);
    res.status(200).send('ok');
  });
}

module.exports = webhooks;
// 18
// https://github.com/howdyai/botkit/blob/master/examples/facebook_bot.js
// https://github.com/howdyai/botkit-starter-facebook/blob/master/bot.js

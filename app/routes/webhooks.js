// Webhook router
require('dotenv').config();

function webhooks(app, controller) {

  app.get('/webhook', function (req, res) {
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

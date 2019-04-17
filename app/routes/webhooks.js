// Webhook router
require('dotenv').config();

function webhooks(app, controller) {

  app.get('/webhook', (req, res) => {
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

  app.post('/webhook', (req, res) => {
    var bot = controller.spawn({});
    controller.handleWebhookPayload(req, res, bot);
    res.status(200).send('ok');
  });
}

module.exports = webhooks;

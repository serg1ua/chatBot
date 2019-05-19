// Webhook router
require('dotenv').config();

const logger = require('../../utils/logger');

function webhooks(app, controller) {

  app.get('/webhook', (req, res) => {
    logger.info('WEBHOOK_VERIFIED');
    if (req.query['hub.mode'] == 'subscribe') {
      if (req.query['hub.verify_token'] == process.env.VERIFY_TOKEN) {
        logger.info('WEBHOOK_VERIFIED');
        res.send(req.query['hub.challenge']);
      }
      else {
        res.send('OK');
      }
    }
  });

  app.post('/webhook', (req, res) => {
    const bot = controller.spawn({});
    controller.handleWebhookPayload(req, res, bot);
    res.status(200).send('ok');
  });
}

module.exports = webhooks;

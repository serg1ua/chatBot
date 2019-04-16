// Bot handlers
var bestBuy = require('./best_buy_handler');

function botHandlers(controller) {
  controller.hears('(.*)', 'message_received', function (bot, message) {
    console.log(message);
    bot.reply(message, {
      text: 'Пожалуйста используйте кнопку меню \'Каталог товаров\'',
    });
  });

  controller.hears(process.env.SHOW_CATALOG, 'facebook_postback', function (bot, message) {
    var catalog = bestBuy.getCatalog();
    bot.reply(message, {
      text: 'Используйте кнопку меню \'Каталог товаров\'',
      quick_replies: [{
        "content_type": "text",
        "title": "Каталог товаров",
        "payload": process.env.SHOW_CATALOG,
      }]
    });
  });
}

module.exports = botHandlers;

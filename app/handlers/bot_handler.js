// Bot handlers
var BestBuy = require('./best_buy_handler');
var bestBuy = new BestBuy();

function botHandlers(controller) {

  // Handles all messages
  controller.hears('(.*)', 'message_received', function (bot, message) {
    bot.reply(message, {
      text: 'Пожалуйста используйте кнопку меню \'Каталог товаров\'',
    });
  });

  // Handles \'Каталог товаров \' menue button
  controller.hears(process.env.SHOW_CATALOG, 'facebook_postback', async(bot, message) => {
    var catalog = await bestBuy.getCatalog();
    bot.reply(message, {
      text: 'Каталог товаров',
      quick_replies: getCatalogNames(catalog.categories)
    });
  });

  // Handles \'В магазин\' menue button
  controller.hears(process.env.SHOW_PRODUCTS, 'facebook_postback', async(bot, message) => {
    var collection = await bestBuy.getProducts();
    bot.reply(message, {
      text: 'Наименование товаров',
      quick_replies: getCatalogNames(collection.products)
    });
  });
}

function getCatalogNames(data) {
  var names = [];
  data.forEach(item => {
    var content = {
      'content_type': 'text',
      'title': item.name,
      'payload': item.name
    };
    names.push(content);
  });
  return names;
}

module.exports = botHandlers;

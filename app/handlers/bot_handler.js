// Bot handlers
var BestBuy = require('./best_buy_handler');
var bestBuy = new BestBuy();

function botHandlers(controller) {

  // Handles "\Get Started & Main menue\" buttons
  controller.hears([process.env.FIRST_VISIT, process.env.MAIN_MENUE], 'facebook_postback', (bot, message) => {
    bot.reply(message, {
      text: 'Hi! Nice to see you!',
      quick_replies: greetingMenue()
    });
  });

  // Handles all messages
  controller.hears('(.*)', 'message_received', async(bot, message) => {
    var collection = await bestBuy.getProducts();
    bot.startConversation(message, function (err, convo) {
      convo.ask({
        attachment: {
          'type': 'template',
          'payload': {
            'template_type': 'generic',
            'elements': createProductsGalery(collection.products)
          }
        }
      })
    }, function (response, convo) {
      convo.next();
    });
  });

  // Handles \'Send catalogue\' button
  controller.hears(process.env.SHOW_CATALOGUE, 'facebook_postback', async(bot, message) => {
    var catalog = await bestBuy.getCatalog();
    bot.reply(message, {
      text: 'Send catalogue',
      quick_replies: getCatalogNames(catalog.categories)
    });
  });


  // Handles \'Shop\' button
  controller.hears(process.env.SHOW_PRODUCTS, 'facebook_postback', async(bot, message) => {
    var collection = await bestBuy.getProducts();
    console.log('SHOP facebook_postback');
    bot.reply(message, {
      text: 'Show products',
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

function greetingMenue() {
  var greeteng = [{
      "content_type": "text",
      "title": "My purchases",
      "payload": "my_purchases",
    },
    {
      "content_type": "text",
      "title": "Shop",
      "payload": "show_products",
    },
    {
      "content_type": "text",
      'title': 'Favourites',
      'payload': 'favourites'
    },
    {
      'content_type': 'text',
      'title': 'Invite a friend',
      'payload': 'invite'
    }
  ]
  return greeteng;
}


function createProductsGalery(data) {
  let elements = [];
  data.forEach(item => {
    var content = {
      'title': item.name,
      'image_url': item.images[0].href,
      'subtitle': item.plot,
      'buttons': [{
          'type': 'postback',
          'title': 'LIKE',
          'payload': 'like'
        },
        {
          'type': 'postback',
          'title': 'BUY',
          'payload': 'buy'
        },
        // {
        // 'type': 'web_url',
        // 'url': 'https://petersapparel.parseapp.com/view_item?item_id=101',
        // 'title': 'View Item'
        // }
      ]
    };
    elements.push(content);
  });
  return elements;
}

module.exports = botHandlers;

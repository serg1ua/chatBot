// Bot handlers
const BestBuy = require('./best_buy_handler');
const bestBuy = new BestBuy();

function botHandlers(controller) {

  // Handles "\Get Started & Main menue\" buttons
  controller.hears([process.env.FIRST_VISIT, process.env.MAIN_MENU], 'facebook_postback', (bot, message) => {
    bot.reply(message, {
      text: 'Hi! Nice to see you!',
      quick_replies: greetingMenue()
    });
  });

  // Handles \'My purchases\', \'Shop\', \'Favorites\', \'Invite a friend\' messages
  controller.hears(['My purchases', 'Shop', 'Favorites', 'Invite a friend'], 'message_received', async(bot, message) => {
    console.log(message.quick_reply);
    switch (message.quick_reply.payload) {
    case 'my_purchases':
      bot.reply(message, 'My purchases is under construction');
      break;
    case 'show_products':
      let collection = await bestBuy.getProducts();
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
      }, (response, convo) => {
        convo.next();
      });
      break;
    case 'favorites':
      bot.reply(message, 'Favorites is under construction');
      break;
    case 'invite':
      bot.reply(message, 'Invite a friend is under construction');
      break;
    }
  });

  // Handles \'Send catalogue\' button
  controller.hears(process.env.SHOW_CATALOGUE, 'facebook_postback', async(bot, message) => {
    let catalog = await bestBuy.getCatalog();
    catalog.categories.forEach(el => console.log(el.id));
    bot.reply(message, {
      text: 'Send catalogue',
      quick_replies: getCatalogNames(catalog.categories)
    });
  });


  // Handles \'Shop\' button
  controller.hears('(.*)', 'message_received', async(bot, message) => {
    if (message.quick_reply.payload.startsWith('category?=')) {
      let products = await bestBuy.getProductsFromCatalog(message.quick_reply.payload.replace('category?=', ''));
      bot.startConversation(message, function (err, convo) {
        convo.ask({
          attachment: {
            'type': 'template',
            'payload': {
              'template_type': 'generic',
              'elements': createProductsGalery(products.products)
            }
          }
        })
      }, (response, convo) => {
        convo.next();
      });
    }
  });
}

function getCatalogNames(data) {
  let names = [];
  data.forEach(item => {
    let content = {
      'content_type': 'text',
      'title': item.name,
      'payload': `category?=${item.id}`
    };
    names.push(content);
  });
  return names;
}

function greetingMenue() {
  let greeteng = [{
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
      'title': 'Favorites',
      'payload': 'favorites'
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
      'subtitle': item.plot ? item.plot : item.shortDescription,
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
        {
          'type': 'web_url',
          'url': item.addToCartUrl,
          'title': 'ADD TO CART'
        }
      ]
    };
    elements.push(content);
  });
  return elements;
}

module.exports = botHandlers;

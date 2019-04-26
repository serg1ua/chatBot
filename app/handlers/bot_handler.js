// Bot handlers
const BestBuy = require('./best_buy_handler');
const bestBuy = new BestBuy();
const DB = require('./db_handler');
const db = new DB();

const product = {};

module.exports = (controller) => {

  // Handles "\Get Started & Main menue\" buttons
  controller.hears(process.env.FIRST_VISIT, 'facebook_postback', (bot, message) => {
    bot.reply(message, {
      text: 'Hi! Nice to see you!',
      quick_replies: greetingMenue()
    });
  });

  // Handles \'Send catalogue\' button
  controller.hears(process.env.SHOW_CATALOGUE, 'facebook_postback', async(bot, message) => {
    let catalog = await bestBuy.getCatalog();
    bot.reply(message, {
      text: 'Send catalogue',
      quick_replies: getCatalogNames(catalog.categories)
    });
  });

  // Handles \'My purchases\', \'Shop\', \'Favorites\', \'Invite a friend\' messages
  controller.hears(['My purchases', 'Shop', 'Favorites', 'Invite a friend'], 'message_received', async(bot, message) => {
    console.log(message.quick_reply);
    switch (message.quick_reply.payload) {
    case 'my_purchases':
      const purchases = await db.getPurchases(message.sender.id);
      console.log(purchases);
      bot.reply(message, {
        text: 'Purchases list',
        quick_replies: getCatalogNames(purchases)
      });
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
        });
      }, (response, convo) => {
        convo.next();
      });
      break;
    case 'favorites':
      const list = await db.getFavorites(message.sender.id);
      bot.startConversation(message, (err, convo) => {
        convo.say({
          attachment: {
            'type': 'template',
            'payload': {
              'template_type': 'generic',
              'elements': createFavoriteGalery(list)
            }
          }
        });
      }, (response, convo) => {
        convo.next();
      });
      break;
    case 'invite':
      bot.reply(message, 'Invite a friend');
      break;
    }
  });

  // Handles '*'
  controller.hears('(.*)', 'message_received', async(bot, message) => {
    if (message.quick_reply) {
      if (message.quick_reply.payload.startsWith('product_in_purchased?=')) {
        const responseProduct = await bestBuy.getProductDetales(message.quick_reply.payload.replace('product_in_purchased?=', ''));
        bot.startConversation(message, (err, convo) => {
          convo.ask({
            attachment: {
              'type': 'template',
              'payload': {
                'template_type': 'generic',
                'elements': createProductsGalery([responseProduct], true)
              }
            }
          });
        }, (response, convo) => {
          convo.next();
        });
      }
      else if (message.quick_reply.payload.startsWith('category?=')) {
        let products = await bestBuy.getProductsFromCatalog(message.quick_reply.payload.replace('category?=', ''));
        bot.startConversation(message, function (err, convo) {
          convo.ask({
            attachment: {
              'type': 'template',
              'payload': {
                'template_type': 'generic',
                'elements': createProductsGalery(products.products, false)
              }
            }
          });
        }, (response, convo) => {
          convo.next();
        });
      }
    }
    if (message.postback) {
      if (message.postback.payload.startsWith('favorite=')) {
        const userId = message.sender.id;
        const item = message.postback.payload.replace('favorite=', '');
        let favorite = await db.checkFavorite(item);
        if (!favorite) {
          favorite = await db.addNewFavorite(userId, item, message.timestamp);
        }
        if (favorite) {
          bot.reply(message, {
            'text': 'Added to favorites',
            'quick_replies': [{
              'content_type': 'text',
              'title': 'Show favorites',
              'payload': 'favorites'
            }]
          });
        }
      }
      else if (message.postback.payload.startsWith('product?=')) {
        const responseProduct = await bestBuy.getProductDetales(message.postback.payload.replace('product?=', ''));
        product.sku = responseProduct.sku;
        product.userId = message.sender.id;
        bot.startConversation(message, (err, convo) => {
          convo.ask({
            attachment: {
              'type': 'template',
              'payload': {
                'template_type': 'generic',
                'elements': createProductsGalery([responseProduct], false)
              }
            }
          });
        }, (response, convo) => {
          convo.next();
        });
      }
      else if (message.postback.payload === process.env.SHARE_NUMBER) {
        bot.startConversation(message, (err, convo) => {
          convo.ask({
            'text': 'Share your phone number',
            'quick_replies': [{
              'content_type': 'user_phone_number'
            }],
            'payload': 'user_phone'
          });
        }, (response, convo) => {
          convo.next();
        });
      }
    }
    if (message.nlp && message.nlp.entities && message.nlp.entities.phone_number) {
      // console.log(phoneRegexp.test(message.test));
      console.log(message);
      product.phone = message.text;
      product.userId = message.sender.id;
      bot.startConversation(message, function (err, convo) {
        var self = product;
        var db = new DB();
        convo.ask({
          'text': 'Share your location',
          'quick_replies': [{
            'content_type': 'location'
          }],
          'payload': 'location'
        }, async(response, convo) => {
          if (response && response.attachments) {
            self.coordinates = response.attachments[0].payload.coordinates;
            self.timestamp = response.timestamp;
            let savePurchase = await db.savePurchase(product);
            if (savePurchase) {
              convo.say('Thank you for your purchase, it will be delivered within 2 days');
              convo.next();
            }
          }
          else {
            convo.next();
          }
        });
      }, (response, convo) => {
        convo.next();
      });
    }
  });
};

///// Helper functions //////
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

function getCatalogNames(data) {
  let names = [];
  data.forEach(item => {
    let content = {
      'content_type': 'text',
      'title': item.name ? item.name : new Date(item.timestamp).toString().substring(0, 15),
      'payload': item.name ? `category?=${item.id}` : `product_in_purchased?=${item.sku}`
    };
    names.push(content);
  });
  return names;
}

function createProductsGalery(data, marker) {
  let elements = [];
  data.forEach(item => {

    let content = {
      'title': item.name,
      'image_url': item.images[0].href,
      'subtitle': item.plot ? item.plot : item.shortDescription,
      'buttons': createProductsButtons(data, item, marker)
    };
    elements.push(content);
  });
  return elements;
}

function createFavoriteGalery(data) {
  let elements = [];
  data.forEach(item => {
    let content = {
      'title': item.name,
      'image_url': item.image,
      'buttons': [{
          'type': 'postback',
          'title': 'Detales',
          'payload': `product?=${item.sku}`
        },
        {
          'type': 'postback',
          'title': 'Main menu',
          'payload': process.env.FIRST_VISIT
        }
      ]
    };
    elements.push(content);
  });
  return elements;
}

function createProductsButtons(data, item, marker) {
  if (!marker) {
    return [{
        'type': 'postback',
        'title': data.length > 1 ? 'Detales' : 'BUY',
        'payload': data.length > 1 ? `product?=${item.sku}` : process.env.SHARE_NUMBER
      },
      {
        'type': 'postback',
        'title': 'To favorites',
        'payload': `favorite=${item.sku}&${item.name}&${item.images[0].href}`
      },
      {
        'type': 'postback',
        'title': 'Main menu',
        'payload': process.env.FIRST_VISIT
      }
    ];
  }
  else {
    return [{
        'type': 'postback',
        'title': 'Repeat?',
        'payload': `product?=${item.sku}`
      },
      {
        'type': 'postback',
        'title': 'Main menue',
        'payload': process.env.FIRST_VISIT
      }
    ];
  }
}

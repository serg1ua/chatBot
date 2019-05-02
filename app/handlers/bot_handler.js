// Bot handlers
const BestBuy = require('./best_buy_handler');
const bestBuy = new BestBuy();
const DB = require('./db_handler');
const db = new DB();

// Global bot_handler config variable
const BOT_CONFIG = {
  product: {},
  catalogPageNumber: 1,
  productsPageNumber: 1,
  keyword: null
};

module.exports = (controller) => {

  // Handles "\Get Started & Main menue\" buttons
  controller.hears(process.env.FIRST_VISIT, 'facebook_postback', (bot, message) => {
    bot.reply(message, {
      text: 'Hi! Nice to see you!\nUse "Shop button" to browse all the products.\nUse "Send catalogue" to browse the categories.\nOr use "Send message" text area for search specific item',
      quick_replies: greetingMenue()
    });
  });

  // Handles \'Send catalogue\' button
  controller.hears(process.env.SHOW_CATALOGUE, 'facebook_postback', async(bot, message) => {
    BOT_CONFIG.catalogPageNumber = 1;
    catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
  });

  // Handles \'My purchases\', \'Shop\', \'Favorites\', \'Invite a friend\' messages
  controller.hears(['My purchases', 'Shop', 'Favorites', 'Invite a friend', 'Next >>>', '<<< Prev'], 'message_received', async(bot, message) => {
    if (message.quick_reply) {
      let arg = message.quick_reply.payload;
      if (arg === 'my_purchases') {
        const purchases = await db.getPurchases(message.sender.id);
        if (!purchases.length) {
          bot.reply(message, {
            'text': 'You have no purchases yet'
          });
        }
        else {
          bot.reply(message, {
            text: 'Purchases list',
            quick_replies: getMyPurchases(purchases)
          });
        }
      }
      else if (arg === 'favorites') {
        const list = await db.getFavorites(message.sender.id);
        if (!list.length) {
          bot.reply(message, {
            'text': 'You have nothing in favorites yet'
          });
        }
        else {
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
        }
      }
      else if (arg === 'invite') {
        bot.reply(message, 'Invite a friend');
      }
      else if (arg.startsWith('show_products&page?=')) {
        let pageNumber = arg.replace('show_products&page?=', '');
        if (pageNumber === '0') {
          BOT_CONFIG.keyword = null;
          BOT_CONFIG.productsPageNumber = 1;
        }
        else {
          BOT_CONFIG.productsPageNumber = +pageNumber;
        }
        productGaleryBuilder(bot, message, BOT_CONFIG.keyword);
      }
      else if (arg.startsWith('gotoCatalogPage=')) {
        BOT_CONFIG.catalogPageNumber = +arg.replace('gotoCatalogPage=', '');
        catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
      }
    }
  });

  // Handles '*'
  controller.hears('(.*)', 'message_received', async(bot, message) => {
    if (!message.quick_reply && !message.postback && !message.attachments) {
      BOT_CONFIG.keyword = message.text;
      BOT_CONFIG.productsPageNumber = 1;
      productGaleryBuilder(bot, message, BOT_CONFIG.keyword);
    }
    else if (message.quick_reply) {
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
        if (!products.products.length) {
          bot.reply(message, {
            text: 'This catalog is currently empty, pllease try another',
          });
        }
        else {
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
        if (!responseProduct) {
          bot.reply(message, {
            'text': 'No such product'
          });
        }
        else {
          BOT_CONFIG.product.sku = responseProduct.sku;
          BOT_CONFIG.product.userId = message.sender.id;
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
      BOT_CONFIG.product.phone = message.text;
      BOT_CONFIG.product.userId = message.sender.id;
      bot.startConversation(message, (err, convo) => {
        const selfProduct = BOT_CONFIG.product;
        const db = new DB();
        convo.ask({
          'text': 'Share your location',
          'quick_replies': [{
            'content_type': 'location'
          }],
          'payload': 'location'
        }, async(response, convo) => {
          if (response && response.attachments) {
            selfProduct.coordinates = response.attachments[0].payload.coordinates;
            selfProduct.timestamp = response.timestamp;
            let savePurchase = await db.savePurchase(selfProduct);
            if (savePurchase) {
              convo.say('Our courier will contact you within 2 hours');
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

///// Galery builder helper functions /////
async function productGaleryBuilder(bot, message, keyword) {
  let collection = await bestBuy.getProducts(keyword, BOT_CONFIG.productsPageNumber);
  if (!collection.products.length) {
    bot.reply(message, {
      text: 'There are no products in this collection',
    });
  }
  else {
    bot.startConversation(message, (err, convo) => {
      convo.ask({
        attachment: {
          'type': 'template',
          'payload': {
            'template_type': 'generic',
            'elements': createProductsGalery(collection.products, false)
          }
        }
      });
      setTimeout(() => {
        bot.reply(message, {
          text: 'Navigate through list of products',
          quick_replies: quickRepliesBuilder(false, BOT_CONFIG.productsPageNumber)
        });
      }, 3500);
    }, (response, convo) => {
      convo.next();
    });
  }
}

/////Catalog builder helper function /////
async function catalogBuilder(bot, message, pageNumber) {
  let catalog = await bestBuy.getCatalog(BOT_CONFIG.catalogPageNumber);
  if (!catalog.categories.length) {
    bot.reply(message, {
      text: 'There are no categories in this catalogue',
    });
  }
  else {
    bot.reply(message, {
      text: 'Send catalogue',
      quick_replies: quickRepliesBuilder(catalog.categories, pageNumber)
    });
  }
}

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
      "payload": `show_products&page?=0`,
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
  ];
  return greeteng;
}

function quickRepliesBuilder(data, pageNumber) {
  let page = pageNumber;
  let names = [];
  if (page > 1) {
    let back = {
      'content_type': 'text',
      'title': '<<< Prev',
      'payload': data ? `gotoCatalogPage=${page-1}` : `show_products&page?=${page-1}`
    };
    names.push(back);
  }
  if (data) {
    data.forEach(item => {
      let content = {
        'content_type': 'text',
        'title': item.name,
        'payload': `category?=${item.id}`
      };
      names.push(content);
    });
  }
  let next = {
    'content_type': 'text',
    'title': 'Next >>>',
    'payload': data ? `gotoCatalogPage=${page+1}` : `show_products&page?=${page+1}`
  };
  names.push(next);
  return names;
}

function getMyPurchases(data) {
  let names = [];
  data.forEach(item => {
    let content = {
      'content_type': 'text',
      'title': new Date(item.timestamp).toString().substring(0, 15),
      'payload': `product_in_purchased?=${item.sku}`
    };
    names.push(content);
  });
  return names;
}

function createProductsGalery(data, marker) {
  let names = [];
  data.forEach(item => {
    if (!item.images.length) {
      item.images.push({ href: 'https://2.bp.blogspot.com/-fB3ZHgfBUNw/XMbd-eE1RAI/AAAAAAAACAw/ezVLWMXRr-cEwT3VOM5gMWOkfC1cyq6HACLcBGAs/s1600/600px-No_image_available.svg.png' });
    }
    let content = {
      'title': item.name,
      'image_url': item.images[0].href,
      'subtitle': item.plot ? item.plot : item.shortDescription,
      'buttons': createProductsButtons(data, item, marker)
    };
    names.push(content);
  });
  return names;
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

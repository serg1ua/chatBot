///// Bot handlers /////

const to = require('await-to-js').default;
const BestBuy = require('./best_buy_handler');
const DB = require('./db_handler');
const Helpers = require('./bot_helper');
const Errors = require('./error_helper');

const errorHelpers = new Errors();
const helpers = new Helpers();
const bestBuy = new BestBuy();
const db = new DB();

// Global bot_handler config variable
const BOT_CONFIG = {
  product: {},
  catalogPageNumber: 1,
  categoryPageNumber: 1,
  productsPageNumber: 1,
  keyword: null,
  dismiss: true
};

module.exports = (controller) => {

  // Handles "\Get Started & Main menu!!!!!\" buttons
  controller.hears(process.env.FIRST_VISIT, 'facebook_postback', async(bot, message) => {

    // Fetch FB user info
    const FBuser = await bot.getMessageUser(message);

    // Referral handling
    if (message.referral) {

      // Referral users go here
      const [err, user] = await to(db.areYouReferralFirstTime(message.sender.id));
      if (err) {
        bot.reply(message, { text: errorHelpers.dbError(err) });
      }
      else if (user) {
        bot.reply(message, {
          text: 'You are already registered!\nYou cannot use referral twice!',
          quick_replies: helpers.greetingMenu()
        });
      }
      else {
        const [err, newRefUser] = await to(db.saveNewUser(message.sender.id));
        if (err) {
          bot.reply(message, { text: errorHelpers.dbError(err) });
        }
        else {
          const [err, pushToReferrals] = await to(db.pushToReferrals(message.referral.ref, message.sender.id));
          if (err) {
            bot.reply(message, { text: errorHelpers.dbError(err) });
          }
          else {

            // Check how many referrals you involved
            referrals(FBuser, bot, message, 'ref');
          }
        }
      }
    }
    else {

      // New not referral users go here
      const [err, user] = await to(db.areYouReferralFirstTime(message.sender.id));
      if (err) {
        bot.reply(message, { text: errorHelpers.dbError(err) });
      }
      else if (!user) {
        const [err, newUser] = await to(db.saveNewUser(message.sender.id));
        if (err) {
          bot.reply(message, { text: errorHelpers.dbError(err) });
        }
        else {
          bot.reply(message, {
            text: `Hi, ${FBuser.first_name}! Nice to see you!\nUse "Shop button" to browse all the products.\nUse "Send catalogue" to browse the categories.\nOr use "Send message" text area for search specific item`,
            quick_replies: helpers.greetingMenu()
          });
        }
      }
      else {

        // Check how many referrals you involved
        referrals(FBuser, bot, message, 'notRef');
      }
    }
  });

  // Handles \'Send catalogue\' button
  controller.hears(process.env.SHOW_CATALOGUE, 'facebook_postback', async(bot, message) => {
    BOT_CONFIG.catalogPageNumber = 1;
    catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
  });

  // Handles \'My purchases\', \'Shop\', \'Favorites\', \'Invite a friend\' messages
  controller.hears(['My purchases', 'Favorites', 'Invite a friend'], 'message_received', async(bot, message) => {
    if (message.quick_reply) {
      const arg = message.quick_reply.payload;
      switch (arg) {
      case 'my_purchases':
        getMyPurchases(bot, message, 0);
        break;
      case 'favorites':
        getMyFavorites(bot, message, 1);
        break;
      case 'invite':
        controller.api.messenger_profile.get_messenger_code(2000, (err, url) => {
          if (err) {
            console.log(err);
            return err;
          }
          else {
            bot.reply(message, { text: `Send link or image to 3 friend, and get one product for free!` });
            bot.reply(message, { text: `${process.env.BOT_URI}?ref=${message.sender.id}` });
            bot.reply(message, { attachment: { 'type': 'image', 'payload': { url } } });
          }
        }, message.sender.id);
      }
    }
  });

  // Handels Next>>>, <<<Prev
  controller.hears(['Shop', 'Next >>>', '<<< Prev'], 'message_received', async(bot, message) => {
    if (message.quick_reply) {
      const [arg, page] = message.quick_reply.payload.split('=');
      switch (arg) {
      case 'show_products&page?':
        if (page === '0') {
          BOT_CONFIG.keyword = null;
          BOT_CONFIG.productsPageNumber = 1;
        }
        else {
          BOT_CONFIG.productsPageNumber = +page;
        }
        productGaleryBuilder(bot, message, BOT_CONFIG.keyword);
        break;
      case 'gotoCatalogPage':
        BOT_CONFIG.catalogPageNumber = +page;
        catalogBuilder(bot, message, BOT_CONFIG.catalogPageNumber);
        break;
      case 'prchOffset?':
        getMyPurchases(bot, message, +page);
        break;
      case 'goToFavoritePage?':
        getMyFavorites(bot, message, +page);
        break;
      }
    }
  });

  // Handles '*'
  controller.hears('(.*)', 'message_received', async(bot, message) => {

    // Search product by keyword from users input(text area, send message)
    if (!message.quick_reply && !message.postback && !message.attachments) {
      BOT_CONFIG.keyword = message.text;
      BOT_CONFIG.productsPageNumber = 1;
      productGaleryBuilder(bot, message, BOT_CONFIG.keyword);
    }

    // Handling all quick_replies
    if (message.quick_reply) {
      const [arg, payload] = message.quick_reply.payload.split('=');
      switch (arg) {
      case 'product_in_purchased?':
        const [error, responseProduct] = await to(bestBuy.getProductDetales(payload));
        if (error) {
          bot.reply(message, { text: errorHelpers.bestBuyError(error) });
        }
        else {
          bot.reply(message, {
            attachment: {
              'type': 'template',
              'payload': {
                'template_type': 'generic',
                'elements': helpers.createProductsGalery([responseProduct], true)
              }
            }
          });
        }
        break;
      case 'category?':
        const [err, products] = await to(bestBuy.getProductsFromCatalog(payload));
        if (err) {
          bot.reply(message, { text: errorHelpers.bestBuyError(err) });
        }
        else if (!products.products.length) {
          bot.reply(message, {
            text: 'This catalog is currently empty, please try another',
          });
        }
        else {
          bot.reply(message, {
            attachment: {
              'type': 'template',
              'payload': {
                'template_type': 'generic',
                'elements': helpers.createProductsGalery(products.products, false)
              }
            }
          });
        }
        break;
      case 'rate?':
        bot.reply(message, { text: 'Thank you!' });
      }
    }

    // Handling all postback buttons
    if (message.postback) {
      const [arg, payload] = message.postback.payload.split('=');
      switch (arg) {
      case 'favorite':
        const userId = message.sender.id;
        let [err, favorite] = await to(db.checkFavorite(userId, payload));
        if (err) {
          bot.reply(message, { text: errorHelpers.dbError(err) });
        }
        else if (favorite) {
          bot.reply(message, {
            text: `"${favorite.name}"\nis already in favorite list`,
            quick_replies: [{
              'content_type': 'text',
              'title': 'Show favorites',
              'payload': 'favorites'
            }]
          });
        }
        else if (!favorite) {
          [err, favorite] = await to(db.addNewFavorite(userId, payload, message.timestamp));
          if (err) {
            bot.reply(message, { text: errorHelpers.dbError(err) });
          }
          else {
            bot.reply(message, {
              text: 'Added to favorites',
              quick_replies: [{
                'content_type': 'text',
                'title': 'Show favorites',
                'payload': 'favorites'
              }]
            });
          }
        }
        break;
      case 'product?':
        const [error, responseProduct] = await to(bestBuy.getProductDetales(payload));
        if (error) {
          bot.reply(message, { text: errorHelpers.bestBuyError(error) });
        }
        else if (!responseProduct) {
          bot.reply(message, { text: 'No such product' });
        }
        else {
          BOT_CONFIG.product.sku = responseProduct.sku;
          BOT_CONFIG.product.userId = message.sender.id;
          bot.reply(message, {
            attachment: {
              'type': 'template',
              'payload': {
                'template_type': 'generic',
                'elements': helpers.createProductsGalery([responseProduct], false)
              }
            }
          });
        }
        break;
      case process.env.SHARE_NUMBER:
        bot.reply(message, {
          text: 'Share your phone number',
          quick_replies: [{
            'content_type': 'user_phone_number'
          }],
          payload: 'user_phone'
        });
        break;
      }
    }

    // Handels phone number, location and completing purchase process
    if (message.nlp && message.nlp.entities && message.nlp.entities.phone_number) {
      BOT_CONFIG.product.phone = message.text;
      BOT_CONFIG.product.userId = message.sender.id;
      bot.startConversation(message, (err, convo) => {
        const selfProduct = BOT_CONFIG.product;
        const db = new DB();
        convo.ask({
          text: 'Share your location',
          quick_replies: [{
            'content_type': 'location'
          }],
          payload: 'location'
        }, async(response, convo) => {
          if (response && response.attachments) {
            selfProduct.coordinates = response.attachments[0].payload.coordinates;
            selfProduct.timestamp = response.timestamp;
            const [err, savePurchase] = await to(db.savePurchase(selfProduct));
            if (err) {
              bot.reply(message, { text: errorHelpers.dbError(err) });
            }
            else {
              convo.say('Our courier will contact you within 2 hours');

              // Mock 2 days, but not really
              setTimeout(() => {
                bot.reply(message, {
                  text: 'Please rate the product\nHow do you estimate, recommend our product to your friends?',
                  quick_replies: helpers.rate()
                });
              }, 5000);
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

///// Referrals /////
async function referrals(FBuser, bot, message, keyword) {
  const [err, referrals] = await to(db.getReferrals(keyword === 'ref' ? message.referral.ref : message.sender.id));
  if (err) {
    bot.reply(message, { text: errorHelpers.dbError(err) });
  }
  else {
    let refCounter = referrals.referrals.length;
    if (keyword === 'ref') {
      if (refCounter % 3 !== 0) BOT_CONFIG.dismiss = true;
      if (refCounter !== 0 && refCounter % 3 === 0 && BOT_CONFIG.dismiss) {
        bot.say({
          channel: message.referral.ref,
          text: `Congratulations, you have involved 3 new user\nNavigate to "Main menu" to get your bonus`
        });
      }
      bot.reply(message, {
        attachment: helpers.congrats(`Hi, ${FBuser.first_name}, congrats! You have activated promo link. Get some bonuses!`)
      });
    }
    else {
      if (refCounter % 3 !== 0) BOT_CONFIG.dismiss = true;
      if (refCounter !== 0 && refCounter % 3 === 0 && BOT_CONFIG.dismiss) {
        BOT_CONFIG.dismiss = false;
        bot.reply(message, {
          attachment: helpers.congrats(`Congratulations, ${FBuser.first_name}, you have involved 3 new user. Get a product for free!`)
        });
      }
      else {
        bot.reply(message, {
          text: `Welcome back, ${FBuser.first_name}! Nice to see you again!`,
          quick_replies: helpers.greetingMenu()
        });
      }
    }
  }
}

///// Galery builder /////
async function productGaleryBuilder(bot, message, keyword) {
  const [err, collection] = await to(bestBuy.getProducts(keyword, BOT_CONFIG.productsPageNumber));
  if (err) {
    bot.reply(message, { text: errorHelpers.bestBuyError(err) });
  }
  else if (!collection.products.length) {
    bot.reply(message, { text: 'There are no products in this collection' });
  }
  else {
    bot.reply(message, {
      attachment: {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': helpers.createProductsGalery(collection.products, false)
        }
      }
    });
    prevNext(bot, message, 'product', BOT_CONFIG.productsPageNumber, false);
  }
}

///// Catalog builder /////
async function catalogBuilder(bot, message, pageNumber) {
  const [err, catalog] = await to(bestBuy.getCatalog(BOT_CONFIG.catalogPageNumber));
  if (err) {
    bot.reply(message, { text: errorHelpers.bestBuyError(err) });
  }
  else if (!catalog.categories.length) {
    bot.reply(message, { text: 'There are no categories in this catalogue' });
  }
  else {
    bot.reply(message, {
      text: 'Send catalogue',
      quick_replies: helpers.quickRepliesBuilder(catalog.categories, pageNumber, 'catalog', false)
    });
  }
}

///// Get purchases /////
async function getMyPurchases(bot, message, offSet) {
  let prchOffset = 0 + offSet;
  let notNext = false;
  const [err, purchases] = await to(db.getPurchases(message.sender.id, prchOffset));
  if (purchases.length < 8) notNext = true;
  if (err) {
    bot.reply(message, { text: errorHelpers.dbError(err) });
  }
  else if (!purchases.length) {
    bot.reply(message, { text: 'You have no purchases yet' });
  }
  else {
    bot.reply(message, {
      text: 'Purchases list',
      quick_replies: helpers.getMyPurchases(purchases, prchOffset, notNext)
    });
  }
}

///// Get favorites /////
async function getMyFavorites(bot, message, pageNumber) {
  let notNext = false;
  const [err, list] = await to(db.getFavorites(message.sender.id, pageNumber));
  if (list.length < 10) notNext = true;
  if (err) {
    bot.reply(message, { text: errorHelpers.dbError(err) });
  }
  else if (!list.length) {
    bot.reply(message, { text: 'You have nothing in favorites yet' });
  }
  else {
    bot.reply(message, {
      attachment: {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': helpers.createFavoriteGalery(list)
        }
      }
    });
    prevNext(bot, message, 'favorite', pageNumber, notNext);
  }
}

///// Prev Next navigation
function prevNext(bot, message, modifier, pageNumber, notNext) {
  setTimeout(() => {
    bot.reply(message, {
      text: 'Use navigation buttons below',
      quick_replies: helpers.quickRepliesBuilder(false, pageNumber, modifier, notNext)
    });
  }, 3500);
}

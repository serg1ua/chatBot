///// Bot handlers /////

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

    // Referral handling
    if (message.referral) {

      // Referral users go here
      let user = await db.areYouReferralFirstTime(message.sender.id);
      if (user && user.code && user.errmsg) {
        bot.reply(message, { text: errorHelpers.dbError(user) });
      }
      else if (user) {
        bot.reply(message, {
          text: 'You are already registeted',
          quick_replies: helpers.greetingMenue()
        });
      }
      else {
        let newRefUser = await db.saveNewUser(message.sender.id);
        if (newRefUser && newRefUser.code && newRefUser.errmsg) {
          bot.reply(message, { text: errorHelpers.dbError(newRefUser) });
        }
        else {
          let pushToReferrals = await db.pushToReferrals(message.referral.ref, message.sender.id);
          if (pushToReferrals && pushToReferrals.code && pushToReferrals.errmsg) {
            bot.reply(message, { text: errorHelpers.dbError(pushToReferrals) });
          }
          else {

            // Check how many referrals you involved
            let referrals = await db.getReferrals(message.referral.ref);
            if (referrals && referrals.code && referrals.errmsg) {
              bot.reply(message, { text: errorHelpers.dbError(referrals) });
            }
            else {
              let refCounter = referrals.referrals.length;
              console.log(refCounter % 3);
              if (refCounter % 3 !== 0) BOT_CONFIG.dismiss = true;
              if (refCounter !== 0 && refCounter % 3 === 0 && BOT_CONFIG.dismiss) {
                bot.say({
                  channel: message.referral.ref,
                  text: 'Congratulations, you have involved 3 new user\nNavigate to "Main menu" to get your bonus'
                });
                bot.reply(message, {
                  attachment: helpers.congrats('Hi, congrats! You have activated promo link. Get some bonuses!')
                });
              }
            }
          }
        }
      }
    }
    else {

      // New not referral users go here
      let user = await db.areYouReferralFirstTime(message.sender.id);
      if (user && user.code && user.errmsg) {
        bot.reply(message, { text: errorHelpers.dbError(user) });
      }
      else if (!user) {
        let newUser = await db.saveNewUser(message.sender.id);
        if (newUser && newUser.code && newUser.errmsg) {
          bot.reply(message, { text: errorHelpers.dbError(newUser) });
        }
        else {
          bot.reply(message, {
            text: 'Hi! Nice to see you!\nUse "Shop button" to browse all the products.\nUse "Send catalogue" to browse the categories.\nOr use "Send message" text area for search specific item',
            quick_replies: helpers.greetingMenue()
          });
        }
      }
      else {

        // Check how many referrals you involved
        let referrals = await db.getReferrals(message.sender.id);
        if (referrals && referrals.code && referrals.errmsg) {
          bot.reply(message, { text: errorHelpers.dbError(referrals) });
        }
        else {
          let refCounter = referrals.referrals.length;
          console.log(refCounter % 3);
          if (refCounter % 3 !== 0) BOT_CONFIG.dismiss = true;
          if (refCounter !== 0 && refCounter % 3 === 0 && BOT_CONFIG.dismiss) {
            BOT_CONFIG.dismiss = false;
            bot.reply(message, {
              attachment: helpers.congrats('Congratulations, you have involved 3 new user. Get a product for free!')
            });
          }
          else {
            bot.reply(message, {
              text: 'Welcome back! Nice to see you again!',
              quick_replies: helpers.greetingMenue()
            });
          }
        }
      }
    }
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
      console.log(arg);
      if (arg === 'my_purchases') {
        getMyPurchases(bot, message, 0);
      }
      else if (arg === 'favorites') {
        getMyFavorites(bot, message, 1);
      }
      else if (arg === 'invite') {
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
      else if (arg.startsWith('prchOffset?=')) {
        getMyPurchases(bot, message, +arg.replace('prchOffset?=', ''));
      }
      else if (arg.startsWith('goToFavoritePage?=')) {
        getMyFavorites(bot, message, +arg.replace('goToFavoritePage?=', ''));
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
    else if (message.quick_reply) {
      if (message.quick_reply.payload.startsWith('product_in_purchased?=')) {
        const responseProduct = await bestBuy.getProductDetales(message.quick_reply.payload.replace('product_in_purchased?=', ''));
        if (responseProduct && responseProduct.data && responseProduct.data.error) {
          bot.reply(message, { text: errorHelpers.bestBuyError(responseProduct) });
        }
        else {
          bot.startConversation(message, (err, convo) => {
            convo.ask({
              attachment: {
                'type': 'template',
                'payload': {
                  'template_type': 'generic',
                  'elements': helpers.createProductsGalery([responseProduct], true)
                }
              }
            });
          }, (response, convo) => {
            convo.next();
          });
        }
      }
      else if (message.quick_reply.payload.startsWith('category?=')) {
        let products = await bestBuy.getProductsFromCatalog(message.quick_reply.payload.replace('category?=', ''));
        if (products && products.data && products.data.error) {
          bot.reply(message, { text: errorHelpers.bestBuyError(products) });
        }
        else if (!products.products.length) {
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
                  'elements': helpers.createProductsGalery(products.products, false)
                }
              }
            });
          }, (response, convo) => {
            convo.next();
          });
        }
      }
      else if (message.quick_reply.payload.startsWith('rate?=')) {
        bot.reply(message, {
          text: 'Thank you!'
        });
      }
    }

    // Handling all postback buttons
    if (message.postback) {
      if (message.postback.payload.startsWith('favorite=')) {
        const userId = message.sender.id;
        const item = message.postback.payload.replace('favorite=', '');
        let favorite = await db.checkFavorite(userId, item);
        if (favorite && favorite.code && favorite.errmsg) {
          bot.reply(message, { text: errorHelpers.dbError(favorite) });
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
          favorite = await db.addNewFavorite(userId, item, message.timestamp);
          if (favorite && favorite.code && favorite.errmsg) {
            bot.reply(message, { text: errorHelpers.dbError(favorite) });
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
      }

      // Collecting data from a user and pushing product to db
      else if (message.postback.payload.startsWith('product?=')) {
        const responseProduct = await bestBuy.getProductDetales(message.postback.payload.replace('product?=', ''));
        if (responseProduct && responseProduct.data && responseProduct.data.error) {
          bot.reply(message, { text: errorHelpers.bestBuyError(responseProduct) });
        }
        else if (!responseProduct) {
          bot.reply(message, { text: 'No such product' });
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
                  'elements': helpers.createProductsGalery([responseProduct], false)
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
            text: 'Share your phone number',
            quick_replies: [{
              'content_type': 'user_phone_number'
            }],
            payload: 'user_phone'
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
          text: 'Share your location',
          quick_replies: [{
            'content_type': 'location'
          }],
          payload: 'location'
        }, async(response, convo) => {
          if (response && response.attachments) {
            selfProduct.coordinates = response.attachments[0].payload.coordinates;
            selfProduct.timestamp = response.timestamp;
            let savePurchase = await db.savePurchase(selfProduct);
            if (savePurchase && savePurchase.code && savePurchase.errmsg) {
              bot.reply(message, { text: errorHelpers.dbError(savePurchase) });
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

///// Galery builder /////
async function productGaleryBuilder(bot, message, keyword) {
  let collection = await bestBuy.getProducts(keyword, BOT_CONFIG.productsPageNumber);
  if (collection && collection.data && collection.data.error) {
    bot.reply(message, { text: errorHelpers.bestBuyError(collection) });
  }
  else if (!collection.products.length) {
    bot.reply(message, { text: 'There are no products in this collection' });
  }
  else {
    bot.startConversation(message, (err, convo) => {
      convo.ask({
        attachment: {
          'type': 'template',
          'payload': {
            'template_type': 'generic',
            'elements': helpers.createProductsGalery(collection.products, false)
          }
        }
      });
      prevNext(bot, message, 'product', BOT_CONFIG.productsPageNumber, false);
    }, (response, convo) => {
      convo.next();
    });
  }
}

///// Catalog builder /////
async function catalogBuilder(bot, message, pageNumber) {
  let catalog = await bestBuy.getCatalog(BOT_CONFIG.catalogPageNumber);
  if (catalog && catalog.data && catalog.data.error) {
    bot.reply(message, { text: errorHelpers.bestBuyError(catalog) });
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
  let purchases = await db.getPurchases(message.sender.id, prchOffset);
  if (purchases.length < 8) notNext = true;
  if (purchases && purchases.code && purchases.errmsg) {
    bot.reply(message, { text: errorHelpers.dbError(purchases) });
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
  console.log('//////////', pageNumber);
  let notNext = false;
  let list = await db.getFavorites(message.sender.id, pageNumber);
  if (list.length < 10) notNext = true;
  if (list && list.code && list.errmsg) {
    bot.reply(message, { text: errorHelpers.dbError(list) });
  }
  else if (!list.length) {
    bot.reply(message, { text: 'You have nothing in favorites yet' });
  }
  else {
    bot.startConversation(message, (err, convo) => {
      convo.say({
        attachment: {
          'type': 'template',
          'payload': {
            'template_type': 'generic',
            'elements': helpers.createFavoriteGalery(list)
          }
        }
      });
      prevNext(bot, message, 'favorite', pageNumber, notNext);
    }, (response, convo) => {
      convo.next();
    });
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

function botSetup(controller) {

  // Setup greeting message
  controller.api.thread_settings.greeting('ПРИВЕТСТВУЮ В НАШЕМ МАГАЗИНЕ!!!');

  // Setup get_started payload
  controller.api.thread_settings.get_started(process.env.FIRST_VISIT);

  // Setup persistent menue
  controller.api.thread_settings.menu(
    [{
      "locale": "default",
      "composer_input_disabled": false,
      "call_to_actions": [{
        "title": "МЕНЮ",
        "type": "nested",
        "call_to_actions": [{
            "title": "ГЛАВНОЕ МЕНЮ",
            "type": "nested",
            "call_to_actions": [{
                "title": "В магазин",
                "type": "postback",
                "payload": "show_products"
              },
              {
                "title": "Мои покупки",
                "type": "postback",
                "payload": "my_purchases"
              },
              {
                "title": "Избранные",
                "type": "postback",
                "payload": "favorite"
              },
              {
                "title": "Пригласить друга",
                "type": "postback",
                "payload": "send_invite"
              }
            ]
          },
          {
            "title": "КАТАЛОГ ТОВАРОВ",
            "type": "postback",
            "payload": "show_catalog"
          }
        ]
      }]
    }]
  );
}

module.exports = botSetup;

function botSetup(controller) {

  // Setup greeting message
  controller.api.thread_settings.greeting('Welcome!');

  // Setup get_started payload
  controller.api.thread_settings.get_started(process.env.FIRST_VISIT);

  // Setup persistent menue
  controller.api.thread_settings.menu(
    [{
      "locale": "default",
      "composer_input_disabled": false,
      "call_to_actions": [{
          "title": "Main menue",
          "type": "postback",
          "payload": "main_menue"
        },
        {
          "title": "Send catalogue",
          "type": "postback",
          "payload": "show_catalogue"
        }
      ]
    }]
  );
}

module.exports = botSetup;

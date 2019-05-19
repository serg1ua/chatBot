require('dotenv').config();

function botSetup(controller) {

  // Setup greeting message
  controller.api.thread_settings.greeting('Welcome to our place!');

  // Setup get_started payload
  controller.api.thread_settings.get_started(process.env.FIRST_VISIT);

  // Setup persistent menu
  controller.api.thread_settings.menu(
    [{
      'locale': 'default',
      'composer_input_disabled': false,
      'call_to_actions': [{
        'title': 'Main menu',
        'type': 'postback',
        'payload': process.env.FIRST_VISIT
      },
      {
        'title': 'Send catalogue',
        'type': 'postback',
        'payload': process.env.SHOW_CATALOGUE
      }
      ]
    }]
  );
}

module.exports = botSetup;

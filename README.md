# Botkit server for Facebook Messenger, using Express, Mongo and BotKit

This app is a demo of using [Botkit](https://github.com/howdyai/botkit) to create a Facebook Messenger bot,
using the MongoDB [adapter](https://github.com/howdyai/botkit-storage-mongo) for storage and 
[Express](http://expressjs.com) to serve webpages.

## Configuration

* For local deployment

1) Create a Facebook page. Add Page ID in .env file (rename the .env-demo file)

2) Create a Facebook app. Add App ID in .env file

3) Add Messenger to your App, then select the Page, to generate a Page Access token. Add Token in .env file

4) install localtunnel to your computer, then use this command to make it available for webhooks

5) Add Webhooks to your app

5.1) Choose a verify token, add it to the .env file as well

5.2) Set the app webhook url to https://yourappname.localtunnel.me/webhook

5.3) Restart your server and click verify

* For Heroku deployment

Add Page ID, App ID, and token as environement variables.
Change the webhook route to match your deployed domain name.
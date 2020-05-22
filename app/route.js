const express = require('express');
const router = express.Router();

// Route for  https://chat-bot-ua.herokuapp.com/
router.get('/', (req, res) => {
  res.render('index');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatController');
const optionalAuth = require('../middleware/optionalAuth');

router.post('/', optionalAuth, chat);

module.exports = router;

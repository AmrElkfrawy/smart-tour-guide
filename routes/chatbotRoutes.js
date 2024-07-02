const express = require('express');
const chatbotConversationController = require('../controllers/chatbotConversationController');
const authController = require('../controllers/authController');
const router = express.Router();

router.use(authController.protect);
router.route('/').get(chatbotConversationController.getChatbotConversation);
router
    .route('/send-message')
    .post(chatbotConversationController.createChatbotConversationMessage);
router
    .route('/clear')
    .delete(chatbotConversationController.clearChatbotConversation);

module.exports = router;

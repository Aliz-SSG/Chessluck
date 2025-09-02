const express = require('express');
const isAuthenticatedUser = require('../middlewares/authMiddleware');
const router = express.Router();
const ChatController = require('../controllers/ChatController')

router.get('/:id', isAuthenticatedUser.isAuthenticatedUser, ChatController.GetMessage)
router.post('/:id', isAuthenticatedUser.isAuthenticatedUser, ChatController.SendMessage)
module.exports = router;
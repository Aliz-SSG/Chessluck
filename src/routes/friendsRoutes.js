const express = require('express');
const isAuthenticatedUser = require('../middlewares/authMiddleware');
const router = express.Router();
const freindsController = require('../controllers/friendsController');
router.get('/', isAuthenticatedUser, freindsController.ShowFriendsList);
router.post('/add/:id', isAuthenticatedUser,)
router.post('/remove/:id', isAuthenticatedUser,)
module.exports = router;  
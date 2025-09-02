const express = require('express');
const isAuthenticatedUser = require('../middlewares/authMiddleware');
const router = express.Router();
const freindsController = require('../controllers/friendsController');
router.get('/', isAuthenticatedUser.isAuthenticatedUser, freindsController.ShowFriendsList);
// router.get('/search', isAuthenticatedUser.isAuthenticatedUser, freindsController.ShowFriendsList);
router.get('/search', isAuthenticatedUser.isAuthenticatedUser, freindsController.SearchUsers);
router.post('/add/:id', isAuthenticatedUser.isAuthenticatedUser, freindsController.AddFriend)
router.post('/remove/:id', isAuthenticatedUser.isAuthenticatedUser, freindsController.RemoveFriend)
module.exports = router;  
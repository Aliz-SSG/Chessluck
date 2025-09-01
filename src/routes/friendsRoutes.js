const express = require('express');
const isAuthenticatedUser = require('../middlewares/authMiddleware');
const router = express.Router();
const freindsController = require('../controllers/friendsController');
router.get('/', isAuthenticatedUser, freindsController.ShowFriendsList);
// router.get('/search', isAuthenticatedUser, freindsController.ShowFriendsList);
router.get('/search', isAuthenticatedUser, freindsController.SearchUsers);
router.post('/add/:id', isAuthenticatedUser, freindsController.AddFriend)
router.post('/remove/:id', isAuthenticatedUser, freindsController.RemoveFriend)
module.exports = router;  
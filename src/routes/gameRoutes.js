const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const isAuthenticatedUser = require('../middlewares/authMiddleware');

router.get('/waiting', isAuthenticatedUser.isAuthenticatedUser, gameController.waitingPage);
router.post('/play/:id', isAuthenticatedUser.isAuthenticatedUser, gameController.matchmaking);
router.get('/:gameId/deck-selection', isAuthenticatedUser.isAuthenticatedUser, gameController.deckselection);
router.post('/:gameId/deck-selection', isAuthenticatedUser.isAuthenticatedUser, gameController.savingdeck);
router.post("/:gameId/start", isAuthenticatedUser.isAuthenticatedUser, gameController.startGame);
router.get('/:gameId', isAuthenticatedUser.isAuthenticatedUser, gameController.gamePage);

module.exports = router;

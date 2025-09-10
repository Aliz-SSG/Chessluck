const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController')
router.post('/play/:id', gameController.matchmaking)
router.get('/:gameId/deck-selection', gameController.deckselection);
router.post('/:gameId/deck-selection', isAuthenticatedUser, gameController.savingdeck);
router.get('/:gameId',)
module.exports = router; 
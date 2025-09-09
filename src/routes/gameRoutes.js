const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController')
router.post('/play/:id', gameController.matchmaking)
router.get('/:gameId/deck-selection',);
module.exports = router; 
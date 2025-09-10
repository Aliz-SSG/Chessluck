const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameID: { type: String, unique: true },
    player1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    player1Deck: { type: mongoose.Schema.Types.ObjectId, ref: 'decks' },
    player2Deck: { type: mongoose.Schema.Types.ObjectId, ref: 'decks' },


    boardState: { type: String }, //JSON.stringify the chess.js board

    turn: { type: String, enum: ["white", "black"], default: "white" },

    state: { type: String, enum: ["deckSelection", "playing", "ended"], default: "deckSelection" },

    moves: [
        {
            from: String,
            to: String,
            piece: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],

    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Game", gameSchema);

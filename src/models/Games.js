const { required } = require('joi');
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameID: { type: String, unique: true, required: true },
    player1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    player1Deck: { type: mongoose.Schema.Types.ObjectId, ref: 'decks' },
    player2Deck: { type: mongoose.Schema.Types.ObjectId, ref: 'decks' },


    boardState: { type: String }, //JSON.stringify the chess.js board
    turn: { type: String, enum: ["white", "black"], default: "white" },
    state: { type: String, enum: ["waiting", "deck-selection", "playing", "finished"], default: "deck-selection" },
    moves: [
        {
            from: String,
            to: String,
            piece: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],

    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    loser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDraw: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    endedAt: { type: Date }
});

module.exports = mongoose.model("Game", gameSchema);

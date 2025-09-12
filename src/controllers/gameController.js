// gameController.js
const User = require('../models/User');
const Game = require('../models/Games.js');
const waitlist = require('../models/matchmaking.js');
const decks = require('../models/decks.js');
const mongoose = require('mongoose');

let io; // will hold Socket.IO instance

exports.setIO = (socketIO) => {
    io = socketIO;
};

exports.matchmaking = async (req, res) => {
    try {
        const user1 = await User.findById(req.user.id);
        if (!user1) {
            req.flash("err_msg", "User not found");
            return res.redirect("/");
        }

        const waitingEntry = await waitlist.findOne();
        console.log("🟨 WAITING ENTRY:", waitingEntry);
        console.log("🟨 WAITING ENTRY.userID:", waitingEntry?.userID);

        if (waitingEntry && waitingEntry.userID) {
            const newGame = new Game({
                player1: waitingEntry.userID,
                player2: user1._id,
                gameID: new mongoose.Types.ObjectId().toString(),
                state: "deck-selection"
            });

            await newGame.save();
            await waitlist.deleteOne({ _id: waitingEntry._id });

            io?.to(waitingEntry.userID.toString())?.emit("goToDeckSelection", { gameId: newGame._id });
            io?.to(user1._id.toString())?.emit("goToDeckSelection", { gameId: newGame._id });

            req.flash("success_msg", "Match found! Redirecting...");
            res.redirect(`/game/${newGame._id}/deck-selection`);
        } else {
            const newEntry = new waitlist({ userID: user1._id });
            await newEntry.save();

            req.flash("success_msg", "Please wait for a match...");
            res.render("waiting", { userId: user1._id });
        }
    } catch (err) {
        console.error("🔥 Matchmaking error:", err);
        req.flash("err_msg", "ERROR " + err.message);
        res.redirect("/");
    }
};

exports.deckselection = async (req, res) => {
    try {
        const { gameId } = req.params;
        const randomDecks = await decks.aggregate([{ $sample: { size: 3 } }]);
        res.render("deckSelection", { decks: randomDecks, gameId, currentUserId: req.user._id });
    } catch (err) {
        req.flash('err_msg', 'ERROR ' + err);
        res.redirect('/');
    }
};

exports.savingdeck = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { selectedDeck } = req.body;
        const game = await Game.findById(gameId);

        if (!game) {
            req.flash('err_msg', 'Game not found');
            return res.redirect('/');
        }

        if (game.player1.toString() === req.user.id.toString()) {
            game.player1Deck = selectedDeck;
        } else if (game.player2.toString() === req.user.id.toString()) {
            game.player2Deck = selectedDeck;
        }
        await game.save();

        if (game.player1Deck && game.player2Deck) {
            io?.to(game.player1.toString())?.emit("bothDecksSelected", { gameId: game._id });
            io?.to(game.player2.toString())?.emit("bothDecksSelected", { gameId: game._id });
            req.flash('success_msg', 'Both players selected decks. Starting game...');
            return res.redirect(`/game/${game._id}`);
        }

        req.flash('success_msg', 'Deck selected. Waiting for opponent...');
        return res.redirect(`/game/${game._id}/deck-selection`);
    } catch (err) {
        req.flash('err_msg', 'ERROR ' + err);
        res.redirect('/');
    }
};

exports.startGame = async (req, res) => {
    try {
        const { gameId } = req.params;
        const game = await Game.findById(gameId)
            .populate("player1Deck")
            .populate("player2Deck");

        if (!game.player1Deck || !game.player2Deck) {
            req.flash("err_msg", "Both players need to select decks first");
            return res.redirect(`/game/${gameId}/deck-selection`);
        }

        let initialFen = game.player1Deck.fenRank;
        game.boardState = initialFen;
        game.state = "playing";
        await game.save();

        res.redirect(`/game/${game._id}`);
    } catch (err) {
        console.error(err);
        req.flash("err_msg", "ERROR " + err);
        res.redirect("/");
    }
};

exports.gamePage = async (req, res) => {
    try {
        const { gameId } = req.params;
        const game = await Game.findById(gameId)
            .populate("player1 player2 player1Deck player2Deck");

        if (!game) {
            req.flash('err_msg', 'Game not found');
            return res.redirect('/');
        }

        res.render("play", {
            gameId: game._id,
            currentUserId: req.user._id,
            player1: game.player1,
            player2: game.player2,
            initialFen: game.boardState || null,
            moves: [],
            chat: []
        });
    } catch (err) {
        req.flash('err_msg', 'ERROR' + err);
        res.redirect('/');
    }
};

exports.waitingPage = (req, res) => {
    res.render('waiting', { userId: req.user.id });
};

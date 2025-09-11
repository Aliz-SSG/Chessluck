const User = require('../models/User');
const Game = require('../models/Games.js')
const isAuthenticatedUser = require('../middlewares/authMiddleware.js');
const waitlist = require('../models/matchmaking.js')
const decks = require('../models/decks.js')
exports.matchmaking = async (req, res) => {
    try {
        const user1 = await User.findById(req.user.id)
        const waitingEntry = await waitlist.findOne();


        if (waitingEntry) {
            const newGame = new Game({
                player1: waitingEntry.userID,
                player2: user1._id
            });
            await newGame.save();
            await waitlist.deleteOne({ _id: waitingEntry._id });


            req.flash('success_msg', 'match starting')
            res.redirect(`/game/${newGame._id}/deck-selection`);

        }
        else {
            const newEntry = new waitlist({
                userID: user1.id,
            });

            await newEntry.save();
            req.flash('success_msg', 'plz wait for the match to start')
            res.redirect('/game/waiting')

        }

    }
    catch (err) {
        req.flash('err_msg', 'ERROR' + err)
        res.redirect('/')
    }
}
exports.deckselection = async (req, res) => {
    try {
        const randomDecks = await decks.aggregate([
            { $sample: { size: 3 } }
        ]);
        res.render("deck-selection", { decks: randomDecks })
    }
    catch (err) {
        req.flash('err_msg', 'ERROR' + err)
        res.redirect('/')
    }
}
exports.savingdeck = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { selectedDeck } = req.body
        const game = await Game.findById(gameId);

        if (game.player1.toString() === req.user.id.toString()) {
            game.player1Deck = selectedDeck;
        } else if (game.player2.toString() === req.user.id.toString()) {
            game.player2Deck = selectedDeck;
        }
        await game.save();

        req.flash('success_msg', 'Deck selected successfully!');
        res.redirect(`/game/${game._id}`);


    }
    catch (err) {
        req.flash('err_msg', 'ERROR' + err)
        res.redirect('/')
    }
}
// in gameController.js, after saving deck
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

        // Combine fenRanks from both decks into one FEN
        // Assuming fenRank is like standard FEN string but represents full board
        // You may need custom merging logic if decks are partial positions
        let initialFen = game.player1Deck.fenRank; // white side
        // If you want black pieces to be from player2Deck, we can mirror / merge:
        // (here assuming fenRank represents full rank of the board)
        // For simplicity, we just let player1Deck be white, player2Deck be black
        // chess.js expects standard FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

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
            initialFen: game.player1Deck?.fenRank || null,
            moves: game.moves
        });
    } catch (err) {
        req.flash('err_msg', 'ERROR' + err);
        res.redirect('/');
    }
}

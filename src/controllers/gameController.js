const User = require('../models/User');
const Game = require('../models/Games.js')
const isAuthenticatedUser = require('../middlewares/authMiddleware.js');
const waitlist = require('../models/matchmaking.js')
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
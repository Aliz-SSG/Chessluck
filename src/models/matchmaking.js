const mongoose = require('mongoose')
const waitlistSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
})
const decksSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pieces: { type: [String], required: true },
    description: { typre: string, required: true }
})
const waitlist = mongoose.model("waitlist", waitlistSchema);
const decks = mongoose.model("decks", decksSchema);

module.exports = { waitlist, decks };
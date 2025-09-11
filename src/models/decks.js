const mongoose = require('mongoose')
const decksSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pieces: { type: [String], required: true },
    description: { type: String, required: true },
    fenRank: { type: String, required: true }
})
const decks = mongoose.model("decks", decksSchema);
module.exports = decks
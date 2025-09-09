const mongoose = require('mongoose')
const waitlistSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
})
module.exports = ('waitlist', waitlistSchema);
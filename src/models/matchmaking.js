const mongoose = require('mongoose')
const waitlistSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
})

const waitlist = mongoose.model("waitlist", waitlistSchema);
module.exports = waitlist;
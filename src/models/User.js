const { string } = require('joi');
const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 33,
        validate: {
            validator(username) {
                if (username.includes(' ') || username.includes('\t') || username.includes('\n')) {
                    throw new Error(`The username contains unacceptable characters`);
                }
            }
        }
    },
    email: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    lastActive: { type: Date, default: Date.now },

    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },

});
userSchema.virtual('winRate').get(function () {
    const totalGames = this.wins + this.losses + this.draws;
    if (totalGames === 0) return 0;
    return (this.wins / totalGames) * 100;
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;

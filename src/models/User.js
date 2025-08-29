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
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]


});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

exports.User = User;

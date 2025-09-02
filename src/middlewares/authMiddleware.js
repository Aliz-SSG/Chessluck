const User = require("../models/User");

async function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        try {
            await User.findByIdAndUpdate(req.user._id, {
                $set: { lastActive: new Date() }
            });
        } catch (err) {
            console.error("Failed to update user activity:", err);
        }
        return next();
    }

    req.flash('err_msg', 'Please login first');
    return res.redirect('/auth/login');
}

function getUserStatus(user) {
    if (!user.lastActive) return "offline";

    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return user.lastActive > fiveMinutesAgo ? "online" : "offline";
}

module.exports = { isAuthenticatedUser, getUserStatus };

const User = require("../models/User");

async function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        try {
            const now = Date.now();
            const lastActive = req.user.lastActive ? new Date(req.user.lastActive).getTime() : 0;

            // Update lastActive only if more than 1 minute has passed
            if (!req.user.lastActive || (now - lastActive) > 60000) {
                await User.findByIdAndUpdate(req.user._id, { $set: { lastActive: new Date() } });
            }
        } catch (err) {
            console.error('Error updating lastActive:', err);
            req.flash("err_msg", 'ERROR: ' + err.message);
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

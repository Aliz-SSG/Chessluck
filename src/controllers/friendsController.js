const { User } = require('../models/User');

exports.ShowFriendsList = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friends", "username email");
        res.render('friends', { friends: user.friends, searchResults: null });
    } catch (err) {
        req.flash("err_msg", "ERROR: " + err.message);
        res.redirect("/");
    }
};

exports.AddFriend = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const friend = await User.findById(req.params.id);

        if (!friend) {
            req.flash("err_msg", "User not found");
            return res.redirect("/friends");
        }

        if (user.friends.includes(friend._id)) {
            req.flash("err_msg", "Already friends");
            return res.redirect("/friends");
        }

        user.friends.push(friend._id);
        await user.save();

        req.flash("success_msg", "Friend added successfully");
        res.redirect("/friends");
    } catch (err) {
        req.flash("err_msg", "ERROR: " + err.message);
        res.redirect("/friends");
    }
};

exports.RemoveFriend = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.friends = user.friends.filter(
            (fid) => fid.toString() !== req.params.id
        );
        await user.save();

        req.flash("success_msg", "Friend removed successfully");
        res.redirect("back");
    } catch (err) {
        req.flash("err_msg", "ERROR: " + err.message);
        res.redirect("back");
    }
};
exports.SearchUsers = async (req, res) => {
    try {
        const query = req.query.q; // e.g., /search?q=ches

        if (!query || query.trim() === "") {
            req.flash("err_msg", "Please enter a search term");
            return res.redirect("/friends");
        }

        const users = await User.find({
            username: { $regex: query, $options: "i" }
        }).select("username email"); // only return these fields

        res.render("friends", { friends: [], searchResults: users });
    } catch (err) {
        console.error(err);
        req.flash("err_msg", "ERROR: " + err.message);
        res.redirect("/");
    }
};
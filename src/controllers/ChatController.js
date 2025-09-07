const Message = require('../models/Message');
const isAuthenticatedUser = require('../middlewares/authMiddleware.js');
const User = require('../models/User');

exports.SendMessage = async (req, res) => {
    try {
        const sender = await User.findById(req.user.id);
        const receiver = await User.findById(req.params.id);

        if (!sender || !receiver) {
            return res.status(404).json({ error: "User not found" });
        }

        const message = await Message.create({
            sender: sender._id,
            receiver: receiver._id,
            text: req.body.message,
            time: new Date()
        });

        res.status(200).json({ success: true, message });
    } catch (err) {
        console.error("SendMessage error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.GetMessage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("friends", "username email lastActive status");

        const friendsWithStatus = user.friends.map(friend => ({
            ...friend.toObject(),
            status: isAuthenticatedUser.getUserStatus(friend)
        }));

        const sender = await User.findById(req.user.id);

        const receiver = friendsWithStatus.find(f => f._id.toString() === req.params.id) ||
            await User.findById(req.params.id);

        const messages = await Message.find({
            $or: [
                { sender: sender._id, receiver: req.params.id },
                { sender: req.params.id, receiver: sender._id }
            ]
        }).sort({ time: 1 });

        res.render("chat", {
            currentUser: sender,
            friend: receiver,
            messages,
            friends: friendsWithStatus
        });
    } catch (err) {
        console.error("GetMessage error:", err);
        req.flash("err_msg", "ERROR: " + err.message);
        res.redirect("/friends");
    }
};

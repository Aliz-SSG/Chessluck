const Message = require('../models/Message');
const isAuthenticatedUser = require('../middlewares/authMiddleware.js');
const User = require('../models/User');

exports.SendMessage = async (req, res) => {
    try {
        const sender = await User.findById(req.user.id);
        const receiver = await User.findById(req.params.id);

        if (!sender || !receiver) {
            req.flash("err_msg", "User not found");
            return res.redirect("/friends");
        }

        const message = await Message.create({
            sender: sender._id,
            receiver: receiver._id,
            text: req.body.message,
            time: new Date()
        });

        res.redirect(`/chat/${receiver._id}`);
    } catch (err) {
        console.error('SendMessage error:', err);
        req.flash("err_msg", "ERROR: " + err.message);
        res.redirect("/friends");
    }
};

exports.GetMessage = async (req, res) => {
    try {
        const sender = await User.findById(req.user.id);
        const receiver = await User.findById(req.params.id);

        const messages = await Message.find({
            $or: [
                { sender: sender._id, receiver: receiver._id },
                { sender: receiver._id, receiver: sender._id }
            ]
        }).sort({ time: 1 });

        res.render("chat", {
            currentUser: sender,
            friend: receiver,
            messages
        });
    } catch (err) {
        req.flash("err_msg", "ERROR: " + err.message);
        res.redirect("/friends");
    }
}
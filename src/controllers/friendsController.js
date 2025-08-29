const { User } = require('../models/User');

exports.ShowFriendsList = (req, res) => {
    res.render('friends')
};

exports.AddFriend = (req, res) => {
    try {
        const user = User.findById(req.user.id)
        const friend = User.findById(req.params.id)

        if (!friend) return req.flash('err_msg', 'User not found')
        if (user.friends.includes(friend._id)) return req.flash('err_msg', 'Already friends')
        user.friends.push(friend._id)
        user.save()
        req.flash('success_msg', 'Friend Added Successfully')
    }
    catch (err) { req.flash('err_msg', 'ERROR:' + err) }
}
exports.RemoveFriend = (req, res) => {
    try {
        const user = User.findById(req.user.id)
        const friend = User.findById(req.params.id)
        user.friends.deletOne(friend._id)
        user.save
        req.flash('success_msg', 'user deleted')
    }
    catch (err) { req.flsh('err_msg', 'ERROR:' + err) }
}
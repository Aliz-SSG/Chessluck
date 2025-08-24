function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    req.flash('err_msg', 'plz login first')
    return res.redirect('/login')
}
module.exports = isAuthenticatedUser
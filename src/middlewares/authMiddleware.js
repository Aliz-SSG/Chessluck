function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    req.flash('err_msg', 'plz login first')
    return res.redirect('/auth/login')
}
module.exports = isAuthenticatedUser
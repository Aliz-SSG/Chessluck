const { User } = require('../models/User');
const crypto = require('crypto');
const async = require('async');
const { recoverypassword, passwordchanged } = require('../utils/email');
const nodemailer = require('nodemailer');
const passportLocalMongoose = require('passport-local-mongoose')

exports.showLoginForm = (req, res) => res.render('login');
exports.showDashboard = (req, res) => res.render('dashboard');
exports.showRecoveryForm = (req, res) => res.render('recovery');
exports.showResetForm = (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                req.flash('err_msg', 'this link has been expired');
                return res.redirect('/auth/recovery');
            }
            res.render('newpass', { token: req.params.token });
        })
        .catch(err => {
            req.flash('err_msg', 'Error: ' + err);
            res.redirect('/auth/recovery');
        });
};
exports.showChangePasswordForm = (req, res) => res.render('chngpass');

exports.registerUser = (req, res) => {
    const { username, email, password } = req.body;
    const userData = { username, email };
    User.register(userData, password, (err, user) => {
        if (err) {
            req.flash('err_msg', 'Error:' + err);
            return res.redirect('/auth/login');
        }
        req.login(user, err => {
            if (err) return next(err);
            req.flash('success_msg', 'account created successfully');
            res.redirect('/auth/dashboard');
        });
    });
};

exports.logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success_msg', 'loged out successfully');
        res.redirect('/auth/login');
    });
};

exports.sendRecoveryEmail = (req, res) => {
    async.waterfall([
        done => {
            crypto.randomBytes(20, (err, buf) => {
                if (err) return done(err);
                const token = buf.toString('hex');
                done(null, token);
            });
        },
        (token, done) => {
            User.findOne({ email: req.body.email })
                .then(user => {
                    if (!user) {
                        req.flash('err_msg', 'No user found with submitted information');
                        return res.redirect('/auth/recovery');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 18000000;
                    user.save().then(() => done(null, token, user));
                })
                .catch(err => {
                    req.flash('err_msg', 'Error: ' + err);
                    res.redirect('/auth/recovery');
                });
        },
        (token, user, done) => {
            recoverypassword(token, user, req.headers.host)
                .then(() => {
                    req.flash('success_msg', 'recovery email sent');
                    res.redirect('/auth/recovery');
                    done(null);
                })
                .catch(err => {
                    req.flash('err_msg', 'sendig recovery email failed');
                    res.redirect('/auth/recovery');
                    done(err);
                });
        }
    ], err => {
        if (err) {
            req.flash('err_msg', 'Erorr:' + err);
            res.redirect('/auth/recovery');
        }
    });
};

exports.resetPassword = (req, res) => {
    async.waterfall([
        done => {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            })
                .then(user => {
                    if (!user) {
                        req.flash('err_msg', 'Token expired');
                        return res.redirect('/auth/recovery');
                    }
                    if (req.body.password !== req.body.conformpassword) {
                        req.flash('err_msg', 'passwords dont match');
                        return res.redirect('/auth/recovery');
                    }
                    user.setPassword(req.body.password, err => {
                        if (err) return done(err);
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save().then(() => done(null, user));
                    });
                })
                .catch(err => {
                    req.flash('err_msg', 'Error: ' + err);
                    res.redirect('/auth/recovery');
                });
        },
        (user, done) => {
            passwordchanged(user)
                .then(() => {
                    req.flash('success_msg', 'password changed successfully');
                    res.redirect('/auth/login');
                    done(null);
                })
                .catch(err => {
                    req.flash('err_msg', '');
                    res.redirect('/auth/login');
                    done(err);
                });
        }
    ], err => {
        if (err) {
            req.flash('err_msg', 'Error:' + err);
            res.redirect('/auth/recovery');
        }
    });
};

exports.changePassword = (req, res) => {
    User.findOne({ email: req.user.email })
        .then(user => {
            user.setPassword(req.body.newPassword, err => {
                if (err) {
                    req.flash('err_msg', 'Error: ' + err);
                    return res.redirect('/auth/changepassword');
                }
                user.save()
                    .then(() => {
                        req.flash('success_msg', 'password changed successfully');
                        res.redirect('/auth/dashboard');
                    })
                    .catch(err => {
                        req.flash('err_msg', 'Error: ' + err);
                        res.redirect('/auth/changepassword');
                    });
            });
        })
        .catch(err => {
            req.flash('err_msg', 'Error: ' + err);
            res.redirect('/auth/changepassword');
        });
};

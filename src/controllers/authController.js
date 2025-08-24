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
                req.flash('err_msg', 'this link has expired');
                return res.redirect('/recovery');
            }
            res.render('newpass', { token: req.params.token });
        })
        .catch(err => {
            req.flash('err_msg', 'Error: ' + err);
            res.redirect('/recovery');
        });
};
exports.showChangePasswordForm = (req, res) => res.render('chngpass');

exports.registerUser = (req, res) => {
    const { username, email, password } = req.body;
    const userData = { username, email };
    User.register(userData, password, (err, user) => {
        if (err) {
            req.flash('err_msg', 'Error:' + err);
            return res.redirect('/login');
        }
        req.login(user, err => {
            if (err) return next(err);
            req.flash('success_msg', 'اکانت با موفقیت ساخته شد');
            res.redirect('/dashboard');
        });
    });
};

exports.logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success_msg', 'با موفقیت خارج شدید');
        res.redirect('/login');
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
                        req.flash('err_msg', 'کاربری با این ایمیل یافت نشد');
                        return res.redirect('/recovery');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 18000000;
                    user.save().then(() => done(null, token, user));
                })
                .catch(err => {
                    req.flash('err_msg', 'Error: ' + err);
                    res.redirect('/recovery');
                });
        },
        (token, user, done) => {
            recoverypassword(token, user, req.headers.host)
                .then(() => {
                    req.flash('success_msg', 'ایمیل بازیابی ارسال شد');
                    res.redirect('/recovery');
                    done(null);
                })
                .catch(err => {
                    req.flash('err_msg', 'ارسال ایمیل ناموفق بود');
                    res.redirect('/recovery');
                    done(err);
                });
        }
    ], err => {
        if (err) {
            req.flash('err_msg', 'خطایی در فرآیند بازیابی رخ داد');
            res.redirect('/recovery');
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
                        req.flash('err_msg', 'توکن نامعتبر یا منقضی شده');
                        return res.redirect('/recovery');
                    }
                    if (req.body.password !== req.body.conformpassword) {
                        req.flash('err_msg', 'رمزها مطابقت ندارند');
                        return res.redirect('/recovery');
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
                    res.redirect('/recovery');
                });
        },
        (user, done) => {
            passwordchanged(user)
                .then(() => {
                    req.flash('success_msg', 'رمز عبور با موفقیت تغییر کرد');
                    res.redirect('/login');
                    done(null);
                })
                .catch(err => {
                    req.flash('err_msg', 'رمز تغییر کرد ولی ایمیل ارسال نشد');
                    res.redirect('/login');
                    done(err);
                });
        }
    ], err => {
        if (err) {
            req.flash('err_msg', 'خطایی در تغییر رمز رخ داد');
            res.redirect('/recovery');
        }
    });
};

exports.changePassword = (req, res) => {
    User.findOne({ email: req.user.email })
        .then(user => {
            user.setPassword(req.body.newPassword, err => {
                if (err) {
                    req.flash('err_msg', 'Error: ' + err);
                    return res.redirect('/changepassword');
                }
                user.save()
                    .then(() => {
                        req.flash('success_msg', 'رمز عبور با موفقیت تغییر کرد');
                        res.redirect('/dashboard');
                    })
                    .catch(err => {
                        req.flash('err_msg', 'Error: ' + err);
                        res.redirect('/changepassword');
                    });
            });
        })
        .catch(err => {
            req.flash('err_msg', 'Error: ' + err);
            res.redirect('/changepassword');
        });
};

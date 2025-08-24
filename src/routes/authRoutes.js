const express = require('express')
const router = express.Router()
const passportLocalMongoose = require('passport-local-mongoose')
const { User } = require('../models/User.js');
const passport = require('passport');
const crypto = require('crypto')
const async = require('async')
const nodemailer = require('nodemailer');
const { recoverypassword } = require('../utils/email')

router.use(express.json());

function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    req.flash('err_msg', 'plz login first')
    return res.redirect('/login')
}
router.get("/login", (req, res) => {
    res.render("login",);
});

router.get('/dashboard', isAuthenticatedUser, (req, res) => {
    res.render('dashboard')
});

router.get('/logout', isAuthenticatedUser, (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success_msg', 'Logged out successfully');
        res.redirect('/login');
    });
});

router.get('/recovery', (req, res) => {
    res.render('recovery')
});

router.get('/reset/:token', (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
        .then(User => {
            if (!User) {
                req.flash('err_msg', 'this link has been expired')
                return res.redirect('/recovery')
            }
            res.render('newpass', { token: req.params.token })
        })
        .catch(err => {
            req.flash('err_msg', 'ERRPR:' + err)
            res.redirect('/recovery')
        })
});
router.get('/changepassword', isAuthenticatedUser, (req, res) => {
    res.render('chngpass')
})


router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    successFlash: 'welcome',
    failureRedirect: '/login',
    failureFlash: 'invalid email or password, try again'
}));

router.post('/signup', (req, res) => {
    let { username, email, password } = req.body;
    let userData = {
        username: username,
        email: email,
    }
    User.register(userData, password, (err, user) => {
        if (err) {
            req.flash('err_msg', 'ERR:' + err)
            return res.redirect('/login')
        }
        passport.authenticate('local')(req, res, () => {
            req.flash('success_msg', 'Account created successfully')
            res.redirect('/dashboard')
        })
    })
});
///Recovery
router.post('/recovery', (req, res, next) => {
    async.waterfall([
        // Step 1: Generate token
        (done) => {
            crypto.randomBytes(20, (err, buf) => {
                if (err) return done(err);
                const token = buf.toString('hex');
                done(null, token);
            });
        },

        // Step 2: Find user and save token
        (token, done) => {
            User.findOne({ email: req.body.email })
                .then(User => {
                    if (!User) {
                        req.flash('err_msg', 'No user found with this email');
                        return res.redirect('/recovery');
                    }

                    User.resetPasswordToken = token;
                    User.resetPasswordExpires = Date.now() + 18000000;

                    User.save()
                        .then(() => done(null, token, User))
                        .catch(err => done(err));
                })
                .catch(err => {
                    req.flash('err_msg', 'Error: ' + err);
                    res.redirect('/recovery');
                });
        },

        // Step 3: Send recovery email
        (token, User, done) => {
            recoverypassword(token, User, req.headers.host)
                .then(() => {
                    req.flash('success_msg', 'Recovery email sent');
                    res.redirect('/recovery');
                    done(null);
                })
                .catch(err => {
                    req.flash('err_msg', 'Failed to send email');
                    res.redirect('/recovery');
                    done(err);
                });
        }
    ], err => {
        if (err) {
            req.flash('err_msg', 'Something went wrong during recovery');
            res.redirect('/recovery');
        }
    });
});

router.post('/reset/:token', (req, res) => {
    async.waterfall([
        // Step 1: Find user and validate password
        (done) => {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            })
                .then(User => {
                    if (!User) {
                        req.flash('err_msg', 'Invalid or expired token');
                        return res.redirect('/recovery');
                    }

                    if (req.body.password !== req.body.conformpassword) {
                        req.flash('err_msg', 'Passwords do not match');
                        return res.redirect('/recovery');
                    }

                    User.setPassword(req.body.password, err => {
                        if (err) return done(err);

                        User.resetPasswordToken = undefined;
                        User.resetPasswordExpires = undefined;

                        User.save()
                            .then(() => done(null, User))
                            .catch(err => done(err));
                    });
                })
                .catch(err => {
                    req.flash('err_msg', 'Error: ' + err);
                    res.redirect('/recovery');
                });
        },

        // Step 2: Send confirmation email
        (User, done) => {
            passwordchanged(User)
                .then(() => {
                    req.flash('success_msg', 'Password changed successfully. Confirmation email sent.');
                    res.redirect('/login');
                    done(null);
                })
                .catch(err => {
                    req.flash('err_msg', 'Password changed, but failed to send confirmation email.');
                    res.redirect('/login');
                    done(err);
                });
        }
    ], err => {
        if (err) {
            req.flash('err_msg', 'Something went wrong during password reset.');
            res.redirect('/recovery');
        }
    });
});

router.post('/changepassword', isAuthenticatedUser, (req, res) => {
    User.findOne({ email: req.user.email })
        .then(User => {
            User.setPassword(req.body.newPassword, err => {
                User.save()
                    .then(User => {
                        req.flash('success_msg', 'Passwod changed successfuly')
                        return res.redirect('/dashboard')
                    })
                    .catch(err => {
                        req.flash('err_msg', 'ERROR:' + err)
                        res.redirect('/changepassword')
                    })
            })
        })
        .catch(err => {
            req.flash('err_msg', 'ERROR:' + err)
            res.redirect('/changepassword')
        })
}),


    module.exports = router
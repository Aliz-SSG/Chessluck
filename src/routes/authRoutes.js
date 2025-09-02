const express = require('express');
const router = express.Router();
const passport = require('passport');;
const authController = require('../controllers/authController.js');
const isAuthenticatedUser = require('../middlewares/authMiddleware.js');

router.get("/login", authController.showLoginForm);
router.get('/dashboard', isAuthenticatedUser.isAuthenticatedUser, authController.showDashboard);
router.get('/logout', isAuthenticatedUser.isAuthenticatedUser, authController.logoutUser);
router.get('/recovery', authController.showRecoveryForm);
router.get('/reset/:token', authController.showResetForm);
router.get('/changepassword', isAuthenticatedUser.isAuthenticatedUser, authController.showChangePasswordForm);

router.post('/login', passport.authenticate('local', {
    successRedirect: '/auth/dashboard',
    successFlash: 'welcome',
    failureRedirect: '/auth/login',
    failureFlash: 'invalid email or password, try again'
}));
router.post('/signup', authController.registerUser);
router.post('/recovery', authController.sendRecoveryEmail);
router.post('/reset/:token', authController.resetPassword);
router.post('/changepassword', isAuthenticatedUser.isAuthenticatedUser, authController.changePassword);


module.exports = router
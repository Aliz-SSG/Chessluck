const express = require('express')
const router = express.Router()
const isAuthenticatedUser = require('../middlewares/authMiddleware.js');

router.use('/auth', require('./authRoutes.js'))
router.use('/game', require('./gameRoutes.js'))

router.get("/friends", isAuthenticatedUser, (req, res) => {
    res.render("friends");
});
router.get("/", (req, res) => {
    res.render("home");
});

router.get(['/about', '/community', '/learn'], (req, res) => {
    res.render("soon");
});

module.exports = router

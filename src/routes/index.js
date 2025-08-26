const express = require('express')
const router = express.Router()
const isAuthenticated = require('../middlewares/authMiddleware')

router.use('/auth', require('./authRoutes.js'))
router.use('/game', require('./gameRoutes.js'))
// router.use('/friends', require('/friends'))
router.get("/friends", isAuthenticated, (req, res) => {
    res.render("friends");
});
router.get("/", (req, res) => {
    res.render("home");
});

router.get(['/about', '/community', '/learn'], (req, res) => {
    res.render("soon");
});

module.exports = router

const express = require('express')
const router = express.Router()

router.use('/auth', require('./authRoutes.js'))
router.use('/game', require('./gameRoutes.js'))
router.use('/friends', require('./friendsRoutes.js'))
router.get("/", (req, res) => {
    res.render("home");
});

router.get(['/about', '/community', '/learn'], (req, res) => {
    res.render("soon");
});

module.exports = router

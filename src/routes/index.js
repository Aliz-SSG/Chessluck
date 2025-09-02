const express = require('express')
const router = express.Router()
const isAuthenticatedUser = require('../middlewares/authMiddleware.js');

router.use('/auth', require('./authRoutes'))
router.use('/game', require('./gameRoutes'))
router.use('/friends', require('./friendsRoutes'))
router.use('/chat', require('./ChatRoutes'))

router.get("/", (req, res) => {
    res.render("home");
});

router.get(['/about', '/community', '/learn'], (req, res) => {
    res.render("soon");
});

module.exports = router

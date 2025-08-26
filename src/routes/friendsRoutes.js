const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middlewares/authMiddleware')
// Your routes here
router.get('/', (req, res) => { /* ... */ });

module.exports = router;  // Must export the router
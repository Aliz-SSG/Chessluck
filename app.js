const express = require("express");
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const router = require('./src/routes/index.js');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const { User } = require('./src/models/User.js')
const config = require('./src/config/index.js')

mongoose.connect(process.env.DATABASE_LOCAL, {})
    .then(() => console.log('connected to mongodb...'))
    .catch(err => console.log('connection to mongodb lost...', err))


app.use(session({
    secret: "canbeanything",
    resave: true,
    saveUninitialized: true
}));


app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.err_msg = req.flash('err_msg')
    res.locals.error = req.flash('error')
    next();
})

app.use(bodyParser.urlencoded({ extended: true }))
app.set('views', path.join(__dirname, '/src/views/layouts'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.use(router);


const Port = process.env.PORT || 5000;
app.listen(Port, console.log(`listening on port ${Port}!!!`));

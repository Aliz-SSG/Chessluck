const dotenv = require('dotenv').config()

const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    session: {
        secret: process.env.SESSION_SECRET,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    },
    db: {
        uri: process.env.DATABASE_LOCAL
    },
    email: {
        user: process.env.Gmail_Email,
        pass: process.env.Gmail_Password
    }
}

module.exports = config

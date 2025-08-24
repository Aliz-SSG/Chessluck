

function recoverypassword(token, User, host) {
    const smtptransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.Gmail_Email,
            pass: process.env.Gmail_Password,
        }
    });

    const mailOptions = {
        to: User.email,
        from: "ChessLuck Support",
        subject: "Email recovery",
        html: `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Recovery</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #111827;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background:rgb(250, 250, 250);
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background: #60a5fa;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .content {
                    padding: 30px;
                    line-height: 1.6;
                }
                .button {
                    display: inline-block;
                    background: #60a5fa;
                    color: white !important;
                    text-decoration: none;
                    padding: 12px 25px;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 15px 0;
                }
                .footer {
                    text-align: center;
                    padding: 15px;
                    font-size: 12px;
                    color: #777;
                    background:rgb(243, 243, 243);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Click the button below to proceed:</p>
                    <p>
                        <a href="http://${host}/reset/${token}" class="button">Reset Password</a>
                    </p>
                    <p>If you didn’t request this, please ignore this email—your account is secure.</p>
                    <p>Thanks,<br>ChessLuck Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 ChessLuck. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>`
    };

    return smtptransport.sendMail(mailOptions);
}
const nodemailer = require('nodemailer');

const smtptransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.Gmail_Email,
        pass: process.env.Gmail_Password,
    }
});

function passwordchanged(User) {
    const mailOptions = {
        to: User.email,
        from: "ChessLuck Support",
        subject: "Password Changed",
        html: `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #111827;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background:rgb(250, 250, 250);
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background: #60a5fa;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .content {
                    padding: 30px;
                    line-height: 1.6;
                }
                .footer {
                    text-align: center;
                    padding: 15px;
                    font-size: 12px;
                    color: #777;
                    background:rgb(243, 243, 243);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Changed</h1>
                </div>
                <div class="content">
                    <p>Hello dear ${User.username},</p>
                    <p>Your password has been changed successfully.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 ChessLuck. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>`
    };

    return smtptransport.sendMail(mailOptions);
}

module.exports = { recoverypassword, passwordchanged };


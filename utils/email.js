const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter;
    if (process.env.NODE_ENV === 'production') {
        transporter = nodemailer.createTransport({
            host: process.env.BERVO_HOST,
            port: process.env.BERVO_PORT,
            auth: {
                user: process.env.BERVO_USERNAME,
                pass: process.env.BERVO_PASSWORD,
            },
        });
    } else {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
    const mailOptions = {
        from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

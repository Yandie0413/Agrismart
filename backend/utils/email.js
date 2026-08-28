const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const envoyerCodeOTP = async (email, code) => {
    const options = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Code de verification - Agri Platform',
        html: `
            <h2>Verification en deux etapes</h2>
            <p>Votre code de verification est :</p>
            <h1 style="color: #2e7d32; font-size: 36px; letter-spacing: 8px;">${code}</h1>
            <p>Ce code expire dans <strong>10 minutes</strong>.</p>
            <p>Si vous n'avez pas demande ce code, ignorez cet email.</p>
        `
    };
    await transporter.sendMail(options);
};

module.exports = { envoyerCodeOTP };
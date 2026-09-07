require('dotenv').config();

// Resend (API HTTPS, port 443) au lieu de nodemailer/SMTP direct (port 465/587) : Railway ne
// peut pas joindre smtp.gmail.com (ETIMEDOUT, confirme via `railway ssh`) - beaucoup de PaaS
// bloquent ou n'arrivent pas a joindre le SMTP sortant classique. Une API HTTPS classique passe
// sans probleme sur le meme reseau qui appelle deja l'API meteo sans souci.
const RESEND_API_URL = 'https://api.resend.com/emails';
// Adresse bac a sable Resend : fonctionne sans verifier de domaine, mais seulement pour envoyer
// vers l'adresse email du compte Resend lui-meme tant qu'aucun domaine n'est verifie sur resend.com/domains.
const EMAIL_FROM = process.env.EMAIL_FROM || 'AgriSmart <onboarding@resend.dev>';

async function envoyerEmail({ to, subject, html }) {
    const reponse = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });
    if (!reponse.ok) {
        const detail = await reponse.text().catch(() => '');
        throw new Error(`Envoi email echoue (${reponse.status}): ${detail}`);
    }
}

const envoyerCodeOTP = async (email, code) => {
    await envoyerEmail({
        to: email,
        subject: 'Code de verification - Agri Platform',
        html: `
            <h2>Verification en deux etapes</h2>
            <p>Votre code de verification est :</p>
            <h1 style="color: #2e7d32; font-size: 36px; letter-spacing: 8px;">${code}</h1>
            <p>Ce code expire dans <strong>10 minutes</strong>.</p>
            <p>Si vous n'avez pas demande ce code, ignorez cet email.</p>
        `,
    });
};

const envoyerLienReset = async (email, lienReset) => {
    await envoyerEmail({
        to: email,
        subject: 'Reinitialisation mot de passe - Agri Platform',
        html: `
            <h2>Reinitialisation de votre mot de passe</h2>
            <p>Cliquez sur le lien ci-dessous :</p>
            <a href="${lienReset}" style="background:#2e7d32;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
                Reinitialiser mon mot de passe
            </a>
            <p>Ce lien expire dans <strong>1 heure</strong>.</p>
        `,
    });
};

module.exports = { envoyerCodeOTP, envoyerLienReset };

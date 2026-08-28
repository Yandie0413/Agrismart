const axios = require('axios');

// Envoie une notification push via l'API Expo. N'echoue jamais bruyamment :
// une erreur ici (token invalide, service Expo indisponible...) ne doit
// jamais casser le flux applicatif qui cree la notification en base.
async function envoyerPushNotification(pushToken, titre, contenu, data = {}) {
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;

    try {
        await axios.post('https://exp.host/--/api/v2/push/send', {
            to: pushToken,
            sound: 'default',
            title: titre,
            body: contenu,
            data,
        }, {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Erreur envoi push Expo :', err.message);
    }
}

module.exports = { envoyerPushNotification };

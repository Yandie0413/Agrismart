const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const verifierToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return error(res, 'Token manquant', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.utilisateur = decoded;
        next();
    } catch (err) {
        return error(res, 'Token invalide ou expire', 401);
    }
};

module.exports = { verifierToken };
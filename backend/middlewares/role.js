const { error } = require('../utils/response');

const autoriser = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.utilisateur.role)) {
            return error(res, 'Acces refuse', 403);
        }
        next();
    };
};

module.exports = { autoriser };
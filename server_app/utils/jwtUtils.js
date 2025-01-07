const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_secret_key';

exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
};

exports.generateToken = (email) => {
    const accessToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};
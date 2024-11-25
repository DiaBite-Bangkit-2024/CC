const jwt = require("jsonwebtoken");
const { email, JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const generateToken = (email) => {
    return jwt.sign(email, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

module.exports = { generateToken };

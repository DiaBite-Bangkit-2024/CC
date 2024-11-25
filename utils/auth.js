const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Mengambil token dari header "Authorization"

    if (!token) {
        return res.status(401).json({ message: "Access Denied" });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        console.log(decoded);
        next(); // Lanjutkan ke middleware berikutnya
    } catch (err) {
        return res.status(403).json({ message: "Invalid Token" });
    }
};

module.exports = { authenticateToken };

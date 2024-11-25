const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Mengambil token dari header "Authorization"

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied : No token found!", error: true });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // Lanjutkan ke middleware berikutnya
  } catch (err) {
    return res.status(403).json({ message: "Invalid token!", error: true });
  }
};

module.exports = { authenticateToken };

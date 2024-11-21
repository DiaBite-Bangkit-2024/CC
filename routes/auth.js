const express = require("express");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");
const nodemailer = require("nodemailer");
const { authenticateToken } = require("../utils/auth");
const db = require("../db");
const router = express.Router();

// Konfigurasi nodemailer untuk mengirim email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email pengirim
        pass: process.env.EMAIL_PASS  // Password aplikasi untuk Gmail
    }
});

// Fungsi untuk mengirim OTP
const sendOTP = (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending OTP:', error);
        } else {
            console.log('OTP sent: ' + info.response);
        }
    });
};

// Register
router.post("/register", async (req, res) => {
    const { email, name, password } = req.body;

    try {
        // Hash password before saving to DB
        const hashedPassword = await hashPassword(password);

        // Generate OTP (4 digit number)
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Save user to database (without verifying OTP yet)
        const query = "INSERT INTO register (email, name, password, otp) VALUES (?, ?, ?, ?)";
        db.query(query, [email, name, hashedPassword, otp], (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({ message: "User already exists" });
                }
                return res.status(500).json({ message: "Database error" });
            }

            // Send OTP email
            sendOTP(email, otp);

            res.status(201).json({ message: "User registered successfully. OTP sent to email." });
        });
    } catch (error) {
        res.status(500).json({ message: "Error processing request" });
    }
});

// Verify OTP
router.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;

    // Check if OTP matches in the database
    const query = "SELECT * FROM register WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = results[0];

        // Verify OTP
        if (user.otp === otp) {
            // Update OTP status to verified (use `is_verified` column)
            const updateQuery = "UPDATE register SET is_verified = ? WHERE email = ?";
            db.query(updateQuery, [1, email], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating OTP status:", updateErr);
                    return res.status(500).json({ message: "Error updating OTP status" });
                }

                res.status(200).json({ message: "OTP verified successfully! Please provide user profile data." });
            });
        } else {
            res.status(400).json({ message: "Invalid OTP" });
        }
    });
});

// Save User Profile (After OTP Verification)
router.post("/user-profile", (req, res) => {
    const { email, age, gender, weight, height, systolic, diastolic } = req.body;

    const query = "SELECT * FROM register WHERE email = ?";
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = results[0];

        // Check if OTP is verified (use `is_verified` column)
        if (!user.is_verified) {
            return res.status(400).json({ message: "OTP not verified. Please verify OTP first." });
        }

        // Save user profile
        const profileQuery = `
            INSERT INTO user (register_id, age, gender, weight, height, systolic, diastolic)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            age = VALUES(age),
            gender = VALUES(gender),
            weight = VALUES(weight),
            height = VALUES(height),
            systolic = VALUES(systolic),
            diastolic = VALUES(diastolic)
        `;
        
        db.query(profileQuery, [user.id, age, gender, weight, height, systolic, diastolic], (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });

            res.status(201).json({ message: "User profile saved successfully" });
        });
    });
});

// Login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM register WHERE email = ?";
    db.query(query, [email], async (err, results) => {
        let response = {
            loginResult: {},
            message: "",
            error: "",
        }
        let resStatus = 200

        if (err) {
            response.error = "User not registered";
            resStatus = 500
            return res.status(resStatus).json(response)
        }

        if (results.length === 0) {
            resStatus = 404
            response.error = "Invalid email or password";
            return res.status(resStatus).json(response)
        }

        const user = results[0];

        if (user.is_verified == 0) {
            resStatus = 403
            response.error = "Your account not verified yet";
            return res.status(resStatus).json(response)
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            resStatus = 400
            response.error = "Invalid email or password";
            return res.status(resStatus).json(response)
        }

        const token = generateToken({ email: user.email });
        response.message = "Login successful";
        response.loginResult = {
            name: user.name,
            userId: user.id,
            token,
        }
        return res.status(resStatus).json(response)
    });
});


// Resend OTP
router.post("/resend-otp", (req, res) => {
    const { email } = req.body;

    // Periksa apakah pengguna terdaftar
    const query = "SELECT * FROM register WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = results[0];

        // Generate OTP baru
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Perbarui database dengan OTP baru
        const updateQuery = "UPDATE register SET otp = ? WHERE email = ?";
        db.query(updateQuery, [otp, email], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Error updating OTP:", updateErr);
                return res.status(500).json({ message: "Error updating OTP" });
            }

            // Kirim ulang OTP ke email
            sendOTP(email, otp);
            res.status(200).json({ message: "OTP resent successfully. Check your email." });
        });
    });
});




module.exports = router;

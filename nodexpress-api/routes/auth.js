require("dotenv").config();
const express = require("express");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");
const nodemailer = require("nodemailer");
const { authenticateToken } = require("../utils/auth");
const db = require("../db");
const router = express.Router();

// Konfigurasi nodemailer untuk mengirim email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email pengirim
    pass: process.env.EMAIL_PASS, // Password aplikasi untuk Gmail
  },
});

// Fungsi untuk mengirim OTP
const sendOTP = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "[DiaBite Account] Your OTP Code",
    html: `
        <p>Hello,</p>
        <p>Your OTP code is: <b>${otp}</b></p>
        <p>Alternatively, you can verify your account by clicking the link below:</p>
        <a href="${verificationUrl}">Verify My Account</a>
        <p>If you did not request this, please ignore this email.</p>
  `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending OTP:", error);
    } else {
      console.log("OTP sent: " + info.response);
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
    const query =
      "INSERT INTO register (email, name, password, otp) VALUES (?, ?, ?, ?)";
    db.query(query, [email, name, hashedPassword, otp], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .json({ message: "User already exists", error: true });
        }
        return res
          .status(500)
          .json({ message: "Database error: " + err, error: true });
      }

      const verificationUrl = `${
        process.env.EXPRESS_URL
      }/auth/verify-otp?email=${encodeURIComponent(
        email
      )}&otp=${encodeURIComponent(otp)}`;

      sendOTP(email, otp, verificationUrl);

      res.status(201).json({
        message: "User registered successfully. OTP sent to email.",
        verificationUrl,
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing request", error: true });
  }
});

// Verify OTP
router.all("/verify-otp", (req, res) => {
  const email = req.body.email || req.query.email || req.header.email;
  const otp = req.body.otp || req.query.otp || req.header.otp;

  // Check if OTP matches in the database
  const query = "SELECT * FROM register WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Database error: " + err, error: true });

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found", error: true });
    }

    const user = results[0];

    // Verify OTP
    if (user.otp === otp) {
      // Update OTP status to verified (use `is_verified` column)
      const updateQuery = "UPDATE register SET is_verified = ? WHERE email = ?";
      db.query(updateQuery, [1, email], (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating OTP status:", updateErr);
          return res.status(500).json({
            message: "Error updating OTP status:" + updateErr,
            error: true,
          });
        }

        // Generate token after OTP is verified
        const token = generateToken({ email: user.email });

        res.status(200).json({
          message:
            "OTP verified successfully! Please provide user profile data.",
          token, // Include the generated token in the response
        });
      });
    } else {
      res.status(400).json({ message: "Invalid OTP", error: true });
    }
  });
});

// Save User Profile (After OTP Verification)
router.post("/save-profile", (req, res) => {
  const { email, age, gender, weight, height, systolic, diastolic } = req.body;

  const query = "SELECT * FROM register WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Database error: " + err, error: true });

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found", error: true });
    }

    const user = results[0];

    // Check if OTP is verified (use `is_verified` column)
    if (!user.is_verified) {
      return res.status(400).json({
        message: "OTP not verified. Please verify OTP first.",
        error: true,
      });
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

    db.query(
      profileQuery,
      [user.id, age, gender, weight, height, systolic, diastolic],
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Database error: " + err, error: true });

        res.status(201).json({ message: "User profile saved successfully" });
      }
    );
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
      error: false,
    };
    let resStatus = 200;

    if (err) {
      response.message = "User not registered";
      response.error = true;
      resStatus = 500;
      return res.status(resStatus).json(response);
    }

    if (results.length === 0) {
      response.error = true;
      resStatus = 404;
      response.message = "Invalid email or password";
      return res.status(resStatus).json(response);
    }

    const user = results[0];

    if (user.is_verified == 0) {
      resStatus = 403;
      response.error = true;
      response.message = "Your account not verified yet";
      return res.status(resStatus).json(response);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      resStatus = 400;
      response.error = true;
      response.message = "Invalid email or password";
      return res.status(resStatus).json(response);
    }

    const token = generateToken({ email: user.email });
    response.message = "Login successful";
    response.loginResult = {
      name: user.name,
      userId: user.id,
      token,
    };
    return res.status(resStatus).json(response);
  });
});

// Resend OTP
router.post("/resend-otp", (req, res) => {
  const { email } = req.body;

  // Periksa apakah pengguna terdaftar
  const query = "SELECT * FROM register WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Database error: " + err, error: true });

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found", error: true });
    }

    const user = results[0];

    // Generate OTP baru
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Perbarui database dengan OTP baru
    const updateQuery = "UPDATE register SET otp = ? WHERE email = ?";
    db.query(updateQuery, [otp, email], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating OTP:", updateErr);
        return res
          .status(500)
          .json({ message: "Error updating OTP", error: true });
      }

      // Kirim ulang OTP ke email
      const verificationUrl = `${
        process.env.EXPRESS_URL
      }/auth/verify-otp?email=${encodeURIComponent(
        email
      )}&otp=${encodeURIComponent(otp)}`;

      sendOTP(email, otp, verificationUrl);

      res.status(200).json({
        message: "OTP resent successfully. Check your email.",
        verificationUrl,
      });
    });
  });
});

// API untuk mendapatkan profil pengguna
router.get("/user-profile", authenticateToken, (req, res) => {
  const { email } = req.user;

  const query = `
        SELECT 
            r.name, r.email, 
            u.age, u.gender, u.height, u.weight, 
            u.systolic, u.diastolic
        FROM 
            register r
        LEFT JOIN 
            user u 
        ON 
            u.register_id = r.id
        WHERE 
            r.email = ?;
    `;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res
        .status(500)
        .json({ message: "Database error: " + err, error: true });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found", error: true });
    }

    const profile = results[0];
    res.status(200).json({
      message: "User profile fetched successfully",
      profile,
    });
  });
});

// API untuk mengedit profil pengguna
router.patch("/edit-profile", authenticateToken, async (req, res) => {
  const { email: currentEmail } = req.user; // Email dari token yang sudah diverifikasi
  const {
    name,
    newEmail,
    password,
    age,
    gender,
    height,
    weight,
    systolic,
    diastolic,
  } = req.body; // Data yang akan diupdate

  // Validasi input
  if (
    !name &&
    !newEmail &&
    !password &&
    !age &&
    !gender &&
    !height &&
    !weight &&
    !systolic &&
    !diastolic
  ) {
    return res
      .status(400)
      .json({ message: "No data provided to update", error: true });
  }

  try {
    // Hash password jika ada
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    // Query untuk mengupdate tabel `register`
    const queryUpdateRegister = `
        UPDATE register 
        SET
            name = COALESCE(?, name),
            email = COALESCE(?, email),
            password = COALESCE(?, password)
        WHERE email = ?;
    `;

    // Query untuk mengupdate tabel `user`
    const queryUpdateUser = `
        UPDATE user 
        SET 
            age = COALESCE(?, age),
            gender = COALESCE(?, gender),
            height = COALESCE(?, height),
            weight = COALESCE(?, weight),
            systolic = COALESCE(?, systolic),
            diastolic = COALESCE(?, diastolic)
        WHERE register_id = (
            SELECT id FROM register WHERE email = ?
        );
    `;

    // Jalankan query untuk update data di tabel `register`
    db.query(
      queryUpdateRegister,
      [name, newEmail, hashedPassword, currentEmail],
      (err, resultRegister) => {
        if (err) {
          console.error("Error updating register table:", err.message);
          return res
            .status(500)
            .json({ message: "Database error: " + err, error: true });
        }

        // Jalankan query untuk update data di tabel `user`
        db.query(
          queryUpdateUser,
          [age, gender, height, weight, systolic, diastolic, newEmail],
          (err, resultUser) => {
            if (err) {
              console.error("Error updating user table:", err.message);
              return res
                .status(500)
                .json({ message: "Database error: " + err, error: true });
            }

            let newToken = null;
            if (newEmail || password) {
              newToken = generateToken({ email: newEmail });
            }

            res.status(200).json({
              message: "Profile updated successfully",
              affectedRows: {
                register: resultRegister.affectedRows,
                user: resultUser.affectedRows,
              },
              token: newToken,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

module.exports = router;

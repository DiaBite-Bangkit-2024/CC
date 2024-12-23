const express = require("express");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");
const nodemailer = require("nodemailer");
const { authenticateToken } = require("../utils/auth");
const db = require("../db");
const router = express.Router();
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { getRandomValues } = require("crypto");

//Bucket Setting

const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
const bucketName = 'diabite';

// Konfigurasi multer untuk menerima file gambar
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });


// Konfigurasi nodemailer untuk mengirim email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email pengirim
    pass: process.env.EMAIL_PASS, // Password aplikasi untuk Gmail
  },
});

// Fungsi untuk mengirim OTP
const sendOTP = (email, otp, verificationUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "[DiaBite Account] Your OTP Code",
    html: `
        <p>Hello,</p>
        <p>Your OTP code is: <b>${otp}</b></p>
        ${
          verificationUrl
            ? `<p>Alternatively, you can verify your account by clicking the link below:</p>
        <a href="${verificationUrl}">Verify My Account</a>
        <p>If you did not request this, please ignore this email.</p>`
            : ""
        }
  `.trim(),
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
      )}&otp=${encodeURIComponent(otp)}&url=true`;

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
  const is_url = req.body.url || req.query.url || req.header.url;

  // Check if OTP matches in the database
  const query = "SELECT * FROM register WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      if (!is_url)
        return res
          .status(500)
          .json({ message: "Database error: " + err, error: true });
      return res.status(500).send("Database error: " + err);
    }

    if (results.length === 0) {
      if (!is_url)
        return res.status(400).json({ message: "User not found", error: true });
      return res.status(400).send("User not found");
    }

    const user = results[0];

    // Verify OTP
    if (user.otp === otp) {
      // Update OTP status to verified (use `is_verified` column)
      const updateQuery =
        "UPDATE register SET is_verified = ?, otp = NULL WHERE email = ?";
      db.query(updateQuery, [1, email], (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Error updating OTP status:", updateErr);
          if (!is_url)
            return res.status(500).json({
              message: "Error updating OTP status:" + updateErr,
              error: true,
            });
          return res.status(500).send("Error updating OTP status:", updateErr);
        }

        // Generate token after OTP is verified
        const token = generateToken({ email: user.email });

        if (!is_url)
          return res.status(200).json({
            message:
              "OTP verified successfully! Please provide user profile data.",
            token, // Include the generated token in the response
          });
        return res.status(200).send("OTP verified successfully!");
      });
    } else {
      if (!is_url)
        return res.status(400).json({ message: "Invalid OTP", error: true });
      res.status(400).send("Invalid OTP");
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

    // Update user profile
    const updateQuery = `
      UPDATE user
      SET age = ?, gender = ?, weight = ?, height = ?, systolic = ?, diastolic = ?
      WHERE register_id = ?
    `;

    db.query(
      updateQuery,
      [age, gender, weight, height, systolic, diastolic, user.id],
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Database error: " + err, error: true });

        // Check if any rows were updated
        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Profile not found for update. Please check the user.",
            error: true,
          });
        }

        res.status(200).json({ message: "User profile updated successfully" });
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
      )}&otp=${encodeURIComponent(otp)}&url=true`;

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
            u.systolic, u.diastolic, u.avatar
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
router.patch("/edit-profile", authenticateToken, upload.single('avatar'), async (req, res) => {
  const { email: currentEmail } = req.user; // Email dari token yang sudah diverifikasi
  const { name, age, gender, height, weight, systolic, diastolic } = req.body; // Data yang akan diupdate

  let avatarUrl = null;

  // Validasi input
  if (!name && !age && !gender && !height && !weight && !systolic && !diastolic && !req.file) {
    return res
      .status(400)
      .json({ message: "No data provided to update", error: true });
  }

  try {
    const updateDatabase = () => {
      // Query untuk mengupdate tabel `register`
      const queryUpdateRegister = `
        UPDATE register
        SET
          name = COALESCE(?, name)
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
          diastolic = COALESCE(?, diastolic),
          avatar = COALESCE(?, avatar)
        WHERE register_id = (
          SELECT id FROM register WHERE email = ?
        );
      `;

      // Jalankan query untuk update data di tabel `register`
      db.query(
        queryUpdateRegister,
        [name, currentEmail],
        (err, resultRegister) => {
          if (err) {
            console.error("Error updating register table:", err.message);
            return res.status(500).json({ message: "Database error: " + err, error: true });
          }

          // Jalankan query untuk update data di tabel `user`
          db.query(
            queryUpdateUser,
            [age, gender, height, weight, systolic, diastolic, avatarUrl, currentEmail],
            (err, resultUser) => {
              if (err) {
                console.error("Error updating user table:", err.message);
                return res.status(500).json({ message: "Database error: " + err, error: true });
              }

              res.status(200).json({
                message: "Profile updated successfully",
                affectedRows: {
                  register: resultRegister.affectedRows,
                  user: resultUser.affectedRows,
                },
                avatarUrl
              });
            }
          );
        }
      );
    }


    // Upload foto ke Google Cloud Storage jika ada file yang diunggah
    if (req.file) {
      const randomString = Math.random().toString(36).substring(2, 12);
      const fileName = Date.now() + "_" + randomString + path.extname(req.file.originalname);
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype,
      });

      blobStream.on('error', (err) => {
        console.error("Error uploading file:", err.message);
        return res.status(500).json({ message: "Error uploading file", error: true });
      });

      blobStream.on('finish', () => {
        avatarUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        updateDatabase();
      });

      blobStream.end(req.file.buffer);
    } else {
      updateDatabase();
    }

  } catch (error) {
    console.error("Error updating profile:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error: " + error, error: true });
  }
});

//Forgot password
router.post("/forget-pw", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email tidak ditemukan",
      error: true,
    });
  }

  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let QUERY = `
    UPDATE register
    SET
      otp = ?
    WHERE email = ?
    `;

    db.query(QUERY, [otp, email], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error: " + err, error: true });
      }

      if (result.affectedRows == 0) {
        return res
          .status(404)
          .json({ message: "User not found!", error: true });
      }

      sendOTP(email, otp, false);

      res.status(200).json({
        message: "OTP sent to your email!",
        error: false,
      });
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error : " + error, error: true });
  }
});

//Reset Password
router.post("/reset-pw", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      message: "Email, OTP, dan newPassword harus disertakan!",
      error: true,
    });
  }

  try {
    const hashedPassword = await hashPassword(newPassword);

    let QUERY = `
    UPDATE register
    SET
      password = ?,
      otp = NULL
    WHERE email = ? AND otp = ?
    `;

    db.query(QUERY, [hashedPassword, email, otp], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error: " + err, error: true });
      }

      if (result.affectedRows == 0) {
        return res
          .status(404)
          .json({ message: "Email or OTP false!", error: true });
      }

      res.status(200).json({
        message: "Password reset successfully!",
        error: false,
      });
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error : " + error, error: true });
  }
});

module.exports = router;

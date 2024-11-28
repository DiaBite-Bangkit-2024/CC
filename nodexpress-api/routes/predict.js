require("dotenv").config();
const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../db");
const { authenticateToken } = require("../utils/auth");

const getInfoPredict = async (req, res, next) => {
  const result = await axios.get(`${process.env.FLASK_URL}`);
  return res.status(result.status).json(result.data);
};

const doPredict = async (req, res, next) => {
  const { email } = req.user; // Email dari token yang sudah diverifikasi
  let finalResult;
  try {
    const result = await axios.post(
      `${process.env.FLASK_URL}/predict`,
      req.body
    );
    finalResult = result;

    const queryDataUser = `
        UPDATE user
        SET
          probability = COALESCE(?, probability)
        WHERE register_id = (
            SELECT id FROM register WHERE email = ?
        );
    `;

    db.query(
      queryDataUser,
      [finalResult.data["prediction"], email],
      (err, resultUser) => {
        if (err) {
          finalResult.data["error"] = true;
          finalResult.data["message"] = "[Database Error]" + err;
        } else {
          finalResult.data["message"] = "Probability updated successfully!";
          finalResult.data["affectedRows"] = resultUser.affectedRows;
        }
      }
    );
  } catch (error) {
    finalResult = error.response;
  }

  return res.status(finalResult.status).json(finalResult.data);
};

router.route("/").get(getInfoPredict).post(authenticateToken, doPredict);

module.exports = router;

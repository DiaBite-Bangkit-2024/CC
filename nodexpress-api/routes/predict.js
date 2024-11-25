require("dotenv").config();
const express = require("express");
const router = express.Router();
const axios = require("axios");

const getInfoPredict = async (req, res, next) => {
  const result = await axios.get(`${process.env.FLASK_URL}`);
  return res.status(result.status).json(result.data);
};

const doPredict = async (req, res, next) => {
  let finalResult;
  try {
    const result = await axios.post(
      `${process.env.FLASK_URL}/predict`,
      req.body
    );
    finalResult = result;
  } catch (error) {
    finalResult = error.response;
  }
  return res.status(finalResult.status).json(finalResult.data);
};

router.route("/").get(getInfoPredict).post(doPredict);

module.exports = router;

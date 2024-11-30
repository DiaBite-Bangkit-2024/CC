require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/auth");
const foodRcmd = require("./routes/food-rcmd");
const predict = require("./routes/predict");
const docs = require("./routes/docs");
const path = require("path");

const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "Service is running!",
    error: false,
  });
});

app.use("/auth", authRoutes);
app.use("/food", foodRcmd);
app.use("/predict", predict);
app.use("/docs", docs);

// handle 404 not found
app.use((req, res, next) => {
  return res.status(404).json({
    error: true,
    message: "Endpoint not available!",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

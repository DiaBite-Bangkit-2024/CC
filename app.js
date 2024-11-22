require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/auth");
const foodRcmd = require("./routes/food-rcmd");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "service is running",
    error: false,
  });
});

app.use("/auth", authRoutes);
app.use("/food", foodRcmd);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

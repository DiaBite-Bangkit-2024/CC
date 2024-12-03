const mysql = require("mysql2");

let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  db.connect((err) => {
    if (err) {
      console.error("Error connecting to the database:", err.message);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("Connected to the database.");
    }
  });

  db.on("error", (err) => {
    console.error("Database error:", err.message);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = db;

const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Maintain a persistent MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // 🔹 Add your MySQL password if required
  database: "job_applications1"
});

// ✅ Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // Stop the server if DB connection fails
  }
  console.log("Connected to MySQL database.");
});

// ✅ Ensure the connection remains alive
db.on("error", (err) => {
  console.error("MySQL error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Reconnecting to MySQL...");
    db.connect();
  }
});

// ✅ Storage setup for resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath); // Create the folder if it doesn’t exist
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ✅ Handle form submission
app.post("/submit", upload.single("resume"), (req, res) => {
  const { firstname, lastname, email, gender, phone, position, start, dob, address, coverletter } = req.body;
  const resumePath = req.file ? req.file.filename : null;

  if (!resumePath) {
    return res.status(400).json({ message: "Resume upload failed" });
  }

  const sql = `INSERT INTO applicants_req (firstname, lastname, email, gender, phone, position, start_date, dob, address, coverletter, resume) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [firstname, lastname, email, gender, phone, position, start, dob, address, coverletter, resumePath], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database insertion failed" });
    }
    res.status(200).json({ message: "Application submitted successfully!" });
  });
});

// ✅ Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

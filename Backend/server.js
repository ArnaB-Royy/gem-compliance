require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed frontends: localhost for dev, add your Vercel URL later in FRONTEND_URL
const allowed = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: allowed }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "GeM backend running" });
});

// OCR route
app.use("/api/ocr", require("./routes/ocr"));

// Clean JSON error for things like a file over 5 MB
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(400).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
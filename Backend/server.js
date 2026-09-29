require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "GeM backend running" });
});

// OCR route 
app.use("/api/ocr", require("./routes/ocr"));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
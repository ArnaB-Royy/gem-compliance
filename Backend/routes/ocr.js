const express = require("express");
const multer = require("multer");
const axios = require("axios");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(), // file stays in RAM, never saved to disk
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Main model from .env first, then backups (duplicates removed)
const MODELS = [
  ...new Set([
    process.env.GEMINI_MODEL || "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
  ]),
];
console.log("Models in order:", MODELS.join(" -> "));

const PROMPTS = {
  gst: `You are reading an Indian GST Registration Certificate.
Return ONLY JSON with these keys:
gstin (printed as "Registration Number"), legalName, tradeName, address, registrationDate (the "Date of Liability" row, not the certificate issue date), constitution.
Also add "confidence": an object giving "high", "medium" or "low" for each key.
Use null for any field you cannot read. Do not guess.`,
  pan: `You are reading an Indian PAN card.
Return ONLY JSON with these keys:
pan, name, fatherName, dob.
Also add "confidence": an object giving "high", "medium" or "low" for each key.
Use null for any field you cannot read. Do not guess.`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(body) {
  let lastErr;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          body,
          { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } }
        );
        console.log("Used model:", model);
        return res;
      } catch (err) {
        lastErr = err;
        const status = err.response?.status;
        console.log(`Model ${model} failed with ${status || err.message}`);
        if (status === 503 || status === 429) {
          await sleep(1500); // busy: retry once, then move to next model
          continue;
        }
        break; // 404 or other error: skip straight to next model
      }
    }
  }
  throw lastErr;
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const docType = (req.body.docType || "").toLowerCase();

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!PROMPTS[docType])
      return res.status(400).json({ error: "docType must be 'gst' or 'pan'" });
    if (!process.env.GEMINI_API_KEY)
      return res.status(500).json({ error: "GEMINI_API_KEY missing in .env" });

    const base64 = req.file.buffer.toString("base64");

    const response = await callGemini({
      contents: [
        {
          parts: [
            { text: PROMPTS[docType] },
            { inline_data: { mime_type: req.file.mimetype, data: base64 } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    });

    const text = response.data.candidates[0].content.parts[0].text;
    const fields = JSON.parse(text);

    res.json({ docType, fields });
  } catch (err) {
    console.error("OCR error:", err.response?.data || err.message);
    res.status(500).json({ error: "OCR failed", detail: err.response?.data || err.message });
  }
});

module.exports = router;
require("dotenv").config();
const axios = require("axios");

axios
  .get("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
  })
  .then((res) => {
    res.data.models
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .forEach((m) => console.log(m.name.replace("models/", "")));
  })
  .catch((err) => console.error(err.response?.data || err.message));
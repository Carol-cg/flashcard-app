require("dotenv").config({ path: '.env' });

const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/explain", async (req, res) => {
  const { concept } = req.body;

  if (!concept) {
    return res.status(400).json({ error: "No concept provided" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const bodyData = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Explain the concept of "${concept}" in 3-4 sentences.
Use simple, everyday language as if talking to a curious 14-year-old.
No bullet points, no headings — just one clear paragraph.
Do not start with "Sure" or "Of course" — go straight into the explanation.`
      }
    ]
  });

  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(bodyData)
    }
  };

  try {
    const explanation = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(parsed.error.message));
            } else {
              resolve(parsed.content[0].text);
            }
          } catch (e) {
            reject(new Error("Failed to parse response"));
          }
        });
      });

      request.on("error", reject);
      request.write(bodyData);
      request.end();
    });

    res.json({ explanation });

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
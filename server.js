require("dotenv").config({ path: '.env' });

const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==============================
// IN-MEMORY DATABASE
// This array stores all saved cards
// (resets when server restarts — no database needed yet)
// ==============================
let cards = [];
let nextId = 1; // Simple ID counter

// ==============================
// AI ROUTE (already existed)
// POST /explain
// ==============================
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
        response.on("data", (chunk) => { data += chunk; });
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

// ==============================
// CRUD ROUTES
// ==============================

// CREATE — Save a new flashcard
// POST /cards
// Body: { concept, explanation }
app.post("/cards", (req, res) => {
  const { concept, explanation } = req.body;

  // Validate both fields exist
  if (!concept || !explanation) {
    return res.status(400).json({ error: "concept and explanation are required" });
  }

  // Build the new card object
  const newCard = {
    id: nextId++,       // Give it a unique ID
    concept,
    explanation,
    createdAt: new Date().toISOString()
  };

  // Push it into our in-memory array
  cards.push(newCard);

  // Return the created card with 201 (Created) status
  res.status(201).json(newCard);
});

// READ ALL — Get all saved flashcards
// GET /cards
app.get("/cards", (req, res) => {
  res.json(cards);
});

// READ ONE — Get a single flashcard by ID
// GET /cards/:id
app.get("/cards/:id", (req, res) => {
  // req.params.id comes from the URL (e.g. /cards/2)
  const id = parseInt(req.params.id);
  const card = cards.find(c => c.id === id);

  if (!card) {
    return res.status(404).json({ error: "Card not found" });
  }

  res.json(card);
});

// UPDATE — Edit a card's explanation
// PUT /cards/:id
// Body: { explanation }
app.put("/cards/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const cardIndex = cards.findIndex(c => c.id === id);

  if (cardIndex === -1) {
    return res.status(404).json({ error: "Card not found" });
  }

  const { explanation } = req.body;

  if (!explanation) {
    return res.status(400).json({ error: "explanation is required" });
  }

  // Update just the explanation, keep everything else
  cards[cardIndex].explanation = explanation;
  cards[cardIndex].updatedAt = new Date().toISOString();

  res.json(cards[cardIndex]);
});

// DELETE — Remove a card
// DELETE /cards/:id
app.delete("/cards/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const cardIndex = cards.findIndex(c => c.id === id);

  if (cardIndex === -1) {
    return res.status(404).json({ error: "Card not found" });
  }

  // Remove the card from the array
  const deletedCard = cards.splice(cardIndex, 1);

  res.json({ message: "Card deleted", card: deletedCard[0] });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
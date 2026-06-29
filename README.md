# 🧠 Flashcard Explainer

A full-stack AI-powered flashcard app built with HTML, CSS, JavaScript, and Node.js/Express.

## What it does
Type any concept and get a plain-English explanation powered by the Anthropic Claude AI API — displayed on an interactive 3D flip card.

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **AI:** Anthropic Claude API
- **Security:** API key stored in environment variables (.env)

## How it works
1. User types a concept into the input box
2. The frontend sends a POST request to the Express `/explain` route
3. The Express server (acting as middleware) securely calls the Anthropic Claude API
4. Claude returns a plain-English explanation
5. The card flips to reveal the explanation

## Setup Instructions

1. Clone the repository
   git clone https://github.com/yourusername/flashcard-app.git

2. Install dependencies
   npm install

3. Create a .env file in the root folder
   ANTHROPIC_API_KEY=your-api-key-here

4. Run the server
   node server.js

5. Open your browser and go to http://localhost:3000

## What I learned
- Building an Express server with POST routes
- Using middleware (express.json, express.static)
- Calling an external AI API securely from a backend
- Storing secrets safely with environment variables
- CSS 3D flip card animations
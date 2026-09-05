const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let cachedFacts = null;
let lastFetchTime = null;

router.get('/', async (req, res) => {
  const now = Date.now();
  if (cachedFacts && lastFetchTime && (now - lastFetchTime < 24 * 60 * 60 * 1000)) {
    return res.json({ facts: cachedFacts });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Provide 3 distinct, interesting, and obscure facts about native Indian flora, biodiversity, or medicinal plants. Each fact should be 2 sentences or less.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
      }
    });
    cachedFacts = JSON.parse(response.text);
    lastFetchTime = now;
    res.json({ facts: cachedFacts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily facts' });
  }
});

module.exports = router;

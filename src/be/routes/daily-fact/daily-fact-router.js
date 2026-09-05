const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { db } = require('../../config/firebase');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.get('/', async (req, res) => {
  try {
    // Determine today's date in IST
    const todayStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const todayDate = new Date(todayStr);
    const today = todayDate.toISOString().split('T')[0];

    // 1. Check Firestore for today's facts
    if (db) {
      const docRef = db.collection('system').doc('daily_facts');
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data.date === today && data.facts && data.facts.length > 0) {
          // Serve from cache
          return res.json({ facts: data.facts });
        }
      }
    }

    // 2. If not in DB or date is outdated (e.g. cron missed), generate on the fly
    console.log('[DailyFact] DB cache miss for today. Generating on the fly...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Provide 3 distinct, interesting, and obscure facts about native Indian flora, biodiversity, or medicinal plants. Each fact should be 2 sentences or less.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
      }
    });
    
    const facts = JSON.parse(response.text);

    // 3. Save to DB for subsequent requests today
    if (db) {
      await db.collection('system').doc('daily_facts').set({
        date: today,
        facts: facts,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ facts });
  } catch (error) {
    console.error('[DailyFact] Error fetching facts:', error);
    res.status(500).json({ error: 'Failed to fetch daily facts' });
  }
});

module.exports = router;

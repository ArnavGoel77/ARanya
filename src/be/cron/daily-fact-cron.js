const cron = require('node-cron');
const { GoogleGenAI } = require('@google/genai');
const { db } = require('../config/firebase');

const initDailyFactCron = () => {
  if (!db) {
    console.warn('[!] Database not initialized, skipping daily fact cron.');
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Schedule to run at 5:00 AM IST every day
  // '0 5 * * *' runs at 05:00
  cron.schedule('0 5 * * *', async () => {
    console.log('[Cron] Running daily fact generation...');
    try {
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
      
      // Get today's date in IST
      const todayStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const todayDate = new Date(todayStr);
      const today = todayDate.toISOString().split('T')[0];
      
      await db.collection('system').doc('daily_facts').set({
        date: today,
        facts: facts,
        timestamp: new Date().toISOString()
      });
      console.log('[Cron] Successfully updated daily facts for', today);
    } catch (error) {
      console.error('[Cron] Failed to generate daily facts:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  
  console.log('[Cron] Daily fact generation scheduled for 5:00 AM IST');
};

module.exports = { initDailyFactCron };

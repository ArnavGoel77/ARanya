const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { buildBotanistPrompt } = require('./botanist-prompt');
// Initialize the Gemini client. It will automatically use the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

/**
 * @route POST /api/v1/chat/botanist
 * @description Processes natural language queries regarding the scanned plant using the AI Botanical Guide.
 */
router.post('/botanist', async (req, res) => {
  try {
    const { user_id, current_plant_context, message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is missing from process.env!");
      return res.status(500).json({ 
        success: false, 
        error: "GEMINI_API_KEY is not configured on the server." 
      });
    }

    // Initialize SDK inside or re-use instance safely
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Prepare the prompt for the LLM
    const llmPrompt = buildBotanistPrompt(current_plant_context, message);
    
    // Call Gemini with automatic retries for "High Demand" (503) errors
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: llmPrompt,
          config: {
            responseMimeType: 'application/json',
          }
        });
        break; // Success! Break out of the loop
      } catch (err) {
        if (retries === 1) throw err; // Out of retries, throw the error
        console.warn(`Gemini API overloaded. Retrying... (${retries - 1} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        retries--;
      }
    }
    
    // Parse the JSON response returned by the model
    const parsedResponse = JSON.parse(response.text);

    // Return the response matching api-spec.md
    res.status(200).json({
      success: true,
      data: {
        chat_title: parsedResponse.chat_title,
        reply_text: parsedResponse.reply_text,
        suggested_followup_queries: parsedResponse.suggested_followup_queries || []
      }
    });

  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;

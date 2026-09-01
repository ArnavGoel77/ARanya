const express = require('express');
const router = express.Router();
const { buildBotanistPrompt } = require('./botanist-prompt');
const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini client. It will automatically use the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

/**
 * @route POST /api/v1/chat/botanist
 * @description Processes natural language queries regarding the scanned plant using the AI Botanical Guide.
 */
router.post('/botanist', async (req, res) => {
  try {
    const { user_id, current_plant_context, message } = req.body;
    
    // Prepare the prompt for the LLM
    const llmPrompt = buildBotanistPrompt(current_plant_context, message);
    
    // Call Gemini to generate the response
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: llmPrompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    // Parse the JSON response returned by the model
    const parsedResponse = JSON.parse(response.text);

    // Return the response matching api-spec.md
    res.status(200).json({
      success: true,
      data: {
        reply_text: parsedResponse.reply_text,
        suggested_followup_queries: parsedResponse.suggested_followup_queries
      }
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;

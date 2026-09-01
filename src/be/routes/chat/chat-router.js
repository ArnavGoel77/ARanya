const express = require('express');
const router = express.Router();
const { buildBotanistPrompt } = require('./botanist-prompt');

/**
 * @route POST /api/v1/chat/botanist
 * @description Processes natural language queries regarding the scanned plant using the AI Botanical Guide.
 */
router.post('/botanist', async (req, res) => {
  try {
    const { user_id, current_plant_context, message } = req.body;

    // Prepare the prompt for the LLM
    const llmPrompt = buildBotanistPrompt(current_plant_context, message);

    // TODO: Send llmPrompt to AI provider (e.g., OpenAI, Vertex AI) and parse response

    // Mock response matching api-spec.md
    res.status(200).json({
      success: true,
      data: {
        reply_text: "Because Croton gibsonianus is highly habitat-specific to the perennial streams of the Western Ghats, it would be extremely difficult to cultivate in a standard home garden in Vellore. Instead, I recommend focusing on native Eastern Ghats species like Gloriosa superba for your local garden to support regional biodiversity.",
        suggested_followup_queries: [
          "What are the best native plants for Vellore?",
          "How do specialized biosphere reserves work?"
        ]
      }
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;

const fetch = require('node-fetch'); // Ensure node-fetch is available, or use native fetch if Node 18+

async function testGeminiAPI() {
  console.log("Sending question to AI Botanist...");
  
  try {
    const response = await fetch('http://127.0.0.1:5000/api/v1/chat/botanist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: "usr_123",
        current_plant_context: "plant_cg_101",
        message: "Can I grow this plant in my home garden?"
      })
    });

    const data = await response.json();
    console.log("\n--- AI Response ---");
    console.dir(data, { depth: null, colors: true });

  } catch (error) {
    console.error("Error connecting to server:", error.message);
  }
}

testGeminiAPI();

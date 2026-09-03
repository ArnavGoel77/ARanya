const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '/api/v1';

export async function askBotanistGuide(plantContext, userMessage) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/botanist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'usr_99823',
        current_plant_context: plantContext,
        message: userMessage,
      }),
    });

    // 1. Check if HTTP status is in the 200-299 range
    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `Server responded with status ${response.status}`);
    }

    const json = await response.json();

    // 2. Safely return data payload
    if (!json.success || !json.data) {
      throw new Error('Invalid API response structure');
    }

    return json.data;
  } catch (error) {
    console.error('Error in askBotanistGuide:', error);
    throw error; // Re-throw so dashboard-page.jsx catch block can handle UI feedback
  }
}

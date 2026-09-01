/**
 * botanist-chat-context.jsx
 *
 * React Context + Provider for the AI Botanical Guide chat feature.
 *
 * STATE (camelCase per .antigravityrules):
 *   - messages         : array of chat message objects
 *   - isSending        : boolean — true while awaiting a bot reply
 *   - errorMessage     : string | null — last API error for the error UI
 *   - currentPlantCtx  : string — plant_id passed as context to the API
 *
 * All API response fields (snake_case) are mapped to camelCase here
 * before being stored in state, keeping the React domain clean.
 */
import React, { createContext, useCallback, useContext, useState } from "react";
import { postBotanistMessage } from "../services/mock-chat-api";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

const BotanistChatContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Wraps any subtree that needs access to the botanist chat state and actions.
 *
 * @param {{ children: React.ReactNode, initialPlantId?: string }} props
 */
export const BotanistChatProvider = ({ children, initialPlantId = "plant_cg_101" }) => {
  /** @type {[Array<{id: string, role: 'user'|'bot', text: string, followups?: string[]}>, Function]} */
  const [messages, setMessages] = useState([]);

  /** True while the mock API call is in-flight. */
  const [isSending, setIsSending] = useState(false);

  /** Holds the last error string, null when clean. */
  const [errorMessage, setErrorMessage] = useState(null);

  /** The plant_id providing botanical context for the session. */
  const [currentPlantCtx, setCurrentPlantCtx] = useState(initialPlantId);

  /**
   * Sends a user message to the Botanical Guide and appends both the user
   * message and bot reply to the messages array.
   *
   * Maps API snake_case response fields → camelCase state:
   *   reply_text                  → text
   *   suggested_followup_queries  → followups
   *
   * @param {string} userText  - The raw text typed by the user.
   * @param {string} userId    - The authenticated user's ID.
   */
  const sendMessage = useCallback(
    async (userText, userId = "usr_99823") => {
      if (!userText?.trim() || isSending) return;

      setErrorMessage(null);
      setIsSending(true);

      // Optimistically append the user message.
      const userMessage = {
        id: `msg_user_${Date.now()}`,
        role: "user",
        text: userText.trim(),
        followups: [],
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // API contract payload uses snake_case.
        const response = await postBotanistMessage({
          user_id: userId,
          current_plant_context: currentPlantCtx,
          message: userText.trim(),
        });

        // Map snake_case → camelCase before storing in state.
        const botMessage = {
          id: `msg_bot_${Date.now()}`,
          role: "bot",
          text: response.data.reply_text,
          followups: response.data.suggested_followup_queries ?? [],
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (err) {
        setErrorMessage(err.message ?? "An unexpected error occurred. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [currentPlantCtx, isSending]
  );

  /** Clears the entire conversation history. */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setErrorMessage(null);
  }, []);

  const contextValue = {
    messages,
    isSending,
    errorMessage,
    currentPlantCtx,
    setCurrentPlantCtx,
    sendMessage,
    clearMessages,
  };

  return (
    <BotanistChatContext.Provider value={contextValue}>
      {children}
    </BotanistChatContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Consumes the BotanistChatContext.
 * Must be used inside a <BotanistChatProvider>.
 *
 * @returns {{
 *   messages: Array,
 *   isSending: boolean,
 *   errorMessage: string|null,
 *   currentPlantCtx: string,
 *   setCurrentPlantCtx: Function,
 *   sendMessage: Function,
 *   clearMessages: Function
 * }}
 */
export const useBotanistChat = () => {
  const ctx = useContext(BotanistChatContext);
  if (!ctx) {
    throw new Error("useBotanistChat must be used within a <BotanistChatProvider>.");
  }
  return ctx;
};

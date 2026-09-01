/**
 * botanist-chat-page.jsx
 *
 * Scaffold placeholder for the AI Botanical Guide chat UI.
 * Wire up to <BotanistChatProvider> and implement message list +
 * input components in this feature's /components directory.
 *
 * Styling: Tailwind semantic tokens only (bg-surface, text-primary, etc.)
 * State  : camelCase via useBotanistChat() hook
 */
import React from "react";
import { BotanistChatProvider } from "../context/botanist-chat-context";

const BotanistChatPage = () => {
  return (
    <BotanistChatProvider>
      <div className="flex flex-col h-full bg-surface rounded-2xl p-6 gap-4">
        <h1 className="text-xl font-semibold text-primary">
          🌿 AI Botanical Guide
        </h1>
        <p className="text-muted-dark text-sm">
          Chat UI components will be implemented here. The{" "}
          <code>useBotanistChat()</code> hook and{" "}
          <code>postBotanistMessage</code> mock service are ready.
        </p>
      </div>
    </BotanistChatProvider>
  );
};

export default BotanistChatPage;

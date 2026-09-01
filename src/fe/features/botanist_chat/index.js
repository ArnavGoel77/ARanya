/**
 * index.js — botanist_chat feature barrel
 *
 * Re-exports the public surface of the botanist_chat feature so that
 * consumers only need a single import path.
 */
export { default as BotanistChatPage } from "./components/botanist-chat-page";
export { BotanistChatProvider, useBotanistChat } from "./context/botanist-chat-context";

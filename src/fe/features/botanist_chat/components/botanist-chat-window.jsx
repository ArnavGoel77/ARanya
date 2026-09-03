import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Bot, User, Loader2, ChevronRight } from "lucide-react";
import { askBotanistGuide } from "../services/chat-service";
import "./botanist-chat-window.css";

export default function BotanistChatWindow({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Reset state when the chat window opens/closes
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setFollowups([]);
      setInputMessage("");
      setHasStarted(false);
      // Welcome message after a short delay
      setTimeout(() => {
        setMessages([{
          id: Date.now(),
          sender: "botanist",
          text: `Hello! I'm your AI Botanical Guide. Ask me anything about plants — identification, cultivation, ecology, conservation, and more. I'm here to help! 🌿`,
          isWelcome: true,
        }]);
        setFollowups([
          "What plants are native to South India?",
          "How do I identify a plant I found?",
          "Which plants are best for home gardening in India?",
        ]);
      }, 300);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && hasStarted) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasStarted]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setHasStarted(true);
    const userMsg = { id: Date.now(), sender: "user", text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage("");
    setFollowups([]);
    setIsLoading(true);

    try {
      const data = await askBotanistGuide("", query);
      setMessages([
        ...updatedMessages,
        { id: Date.now() + 1, sender: "botanist", text: data.reply_text },
      ]);
      setFollowups(data.suggested_followup_queries || []);
    } catch (error) {
      setMessages([
        ...updatedMessages,
        {
          id: Date.now() + 1,
          sender: "botanist",
          text: "I'm having trouble connecting to my botanical archives right now. Please try again in a moment.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bcw-backdrop" onClick={onClose}>
      <div className="bcw-sheet" onClick={(e) => e.stopPropagation()}>

        {/* ── Drag Handle (mobile UX) ── */}
        <div className="bcw-drag-handle" />

        {/* ── Header ── */}
        <div className="bcw-header">
          <div className="bcw-header-left">
            <div className="bcw-avatar">
              <Sparkles size={17} color="#e5a93b" />
            </div>
            <div>
              <p className="bcw-header-title">AI Botanical Guide</p>
              <p className="bcw-header-subtitle">Ask me anything about plants</p>
            </div>
          </div>
          <button className="bcw-close-btn" onClick={onClose} aria-label="Close chat">
            <X size={20} />
          </button>
        </div>

        {/* ── Messages Body ── */}
        <div className="bcw-messages">
          {messages.map((msg) => {
            const isBot = msg.sender === "botanist";
            return (
              <div key={msg.id} className={`bcw-msg-row ${isBot ? "bcw-msg-row--bot" : "bcw-msg-row--user"}`}>
                {isBot && (
                  <div className="bcw-msg-avatar">
                    <Bot size={13} color="#4a7c59" />
                  </div>
                )}
                <div className={`bcw-bubble ${isBot ? "bcw-bubble--bot" : "bcw-bubble--user"} ${msg.isError ? "bcw-bubble--error" : ""} ${msg.isWelcome ? "bcw-bubble--welcome" : ""}`}>
                  <p className="bcw-bubble-text">{msg.text}</p>
                </div>
                {!isBot && (
                  <div className="bcw-msg-avatar bcw-msg-avatar--user">
                    <User size={13} color="#fff" />
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Typing Indicator ── */}
          {isLoading && (
            <div className="bcw-msg-row bcw-msg-row--bot">
              <div className="bcw-msg-avatar">
                <Bot size={13} color="#4a7c59" />
              </div>
              <div className="bcw-bubble bcw-bubble--bot bcw-bubble--typing">
                <span className="bcw-dot" />
                <span className="bcw-dot" />
                <span className="bcw-dot" />
              </div>
            </div>
          )}

          {/* ── Suggested Follow-ups ── */}
          {!isLoading && followups.length > 0 && (
            <div className="bcw-followups">
              <p className="bcw-followups-label">Suggested questions</p>
              <div className="bcw-followup-list">
                {followups.map((q, i) => (
                  <button
                    key={i}
                    className="bcw-followup-chip"
                    onClick={() => handleSendMessage(q)}
                  >
                    <span>{q}</span>
                    <ChevronRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Input Footer ── */}
        <form
          className="bcw-input-bar"
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        >
          <input
            ref={inputRef}
            type="text"
            className="bcw-input"
            placeholder="Ask anything about this plant…"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bcw-send-btn"
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={18} className="bcw-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
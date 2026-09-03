import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, User, Bot, Loader2 } from "lucide-react";
import { askBotanistGuide } from "../services/chat-service";

export default function BotanistChatWindow({
  isOpen,
  onClose,
  plantContext = "Phyllanthus emblica",
  initialResponse = null,
}) {
  const [messages, setMessages] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize conversation when opened or receiving initial data
  useEffect(() => {
    if (initialResponse) {
      setMessages([
        {
          sender: "botanist",
          text: initialResponse.reply_text,
        },
      ]);
      setFollowups(initialResponse.suggested_followup_queries || []);
    }
  }, [initialResponse]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle sending a message (custom input or clicked follow-up)
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    // Append User Message
    const updatedMessages = [...messages, { sender: "user", text: query }];
    setMessages(updatedMessages);
    setInputMessage("");
    setFollowups([]); // Clear previous follow-ups while loading
    setIsLoading(true);

    try {
      const data = await askBotanistGuide(plantContext, query);
      setMessages([
        ...updatedMessages,
        { sender: "botanist", text: data.reply_text },
      ]);
      setFollowups(data.suggested_followup_queries || []);
    } catch (error) {
      setMessages([
        ...updatedMessages,
        {
          sender: "botanist",
          text: "I'm having trouble connecting to my botanical archives right now. Please check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          height: "85vh",
          maxHeight: "700px",
          backgroundColor: "#f5f3eb",
          borderRadius: "1.5rem",
          border: "1px solid rgba(42, 62, 52, 0.15)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            backgroundColor: "#ede9dc",
            borderBottom: "1px solid rgba(42, 62, 52, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#2a3e34",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Sparkles size={18} color="#e5a93b" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontFamily: "serif",
                  color: "#2a3e34",
                }}
              >
                AI Botanical Guide
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#a08355",
                }}
              >
                Context: {plantContext}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "50%",
              color: "#2a3e34",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {messages.map((msg, index) => {
            const isBot = msg.sender === "botanist";
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isBot ? "flex-start" : "flex-end",
                  gap: "0.4rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.7rem",
                    fontFamily: "monospace",
                    color: "#a08355",
                    textTransform: "uppercase",
                  }}
                >
                  {isBot ? (
                    <>
                      <Bot size={14} color="#385e4c" />
                      <span>AI Botanist</span>
                    </>
                  ) : (
                    <>
                      <span>You</span>
                      <User size={14} color="#a08355" />
                    </>
                  )}
                </div>

                <div
                  style={{
                    maxWidth: "85%",
                    padding: "1rem 1.25rem",
                    borderRadius: isBot
                      ? "0rem 1.25rem 1.25rem 1.25rem"
                      : "1.25rem 0rem 1.25rem 1.25rem",
                    backgroundColor: isBot
                      ? msg.isError
                        ? "#fce8e6"
                        : "#ede9dc"
                      : "#2a3e34",
                    color: isBot
                      ? msg.isError
                        ? "#c5221f"
                        : "#1a2e26"
                      : "#ffffff",
                    border: isBot
                      ? "1px solid rgba(42, 62, 52, 0.1)"
                      : "none",
                    fontFamily: "sans-serif",
                    fontSize: "0.925rem",
                    lineHeight: "1.6",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7a70" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: "0.85rem", fontFamily: "sans-serif" }}>
                Consulting botanical knowledge base...
              </span>
            </div>
          )}

          {/* Clickable Suggested Follow-up Options */}
          {!isLoading && followups.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  color: "#a08355",
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "0.6rem",
                }}
              >
                SUGGESTED FOLLOW-UPS:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {followups.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(query)}
                    style={{
                      textAlign: "left",
                      padding: "0.65rem 1rem",
                      borderRadius: "0.85rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(42, 62, 52, 0.18)",
                      color: "#2a3e34",
                      fontFamily: "sans-serif",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2a3e34";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.color = "#2a3e34";
                    }}
                  >
                    💬 {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: "1rem 1.25rem",
            backgroundColor: "#ede9dc",
            borderTop: "1px solid rgba(42, 62, 52, 0.1)",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Ask a question about this plant..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "0.85rem",
              border: "1px solid rgba(42, 62, 52, 0.2)",
              backgroundColor: "#ffffff",
              color: "#1a2e26",
              fontFamily: "sans-serif",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "0.85rem",
              border: "none",
              backgroundColor: "#2a3e34",
              color: "#ffffff",
              cursor: isLoading || !inputMessage.trim() ? "not-allowed" : "pointer",
              opacity: isLoading || !inputMessage.trim() ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontFamily: "sans-serif",
              fontSize: "0.85rem",
              fontWeight: "bold",
            }}
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
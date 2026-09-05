import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Bot, User, Loader2, ChevronRight } from "lucide-react";
import { askBotanistGuide } from "../services/chat-service";
import { useAuth } from "@fe/contexts/AuthContext";
import { db } from "@fe/config/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";
import "./botanist-chat-window.css";

export default function BotanistChatWindow({ isOpen, onClose, plantContext, activeThreadId }) {
  const [messages, setMessages] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasSentNewMessage, setHasSentNewMessage] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const { currentUser } = useAuth();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize or resume chat when window opens
  useEffect(() => {
    if (isOpen) {
      if (activeThreadId) {
        // We're explicitly asked to load a specific past thread
        if (activeThreadId !== threadId) {
          // It's different from what's currently loaded, so reset and fetch
          setMessages([]);
          setFollowups([]);
          setInputMessage("");
          setThreadId(null);
          
          const fetchThread = async () => {
            setIsLoading(true);
            try {
              const docRef = doc(db, "chat_threads", activeThreadId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const data = docSnap.data();
                setMessages(data.messages || []);
                setThreadId(activeThreadId);
                setHasStarted(true); // Treat as started so input focuses
                setHasSentNewMessage(false);
              }
            } catch (err) {
              console.error("Failed to load chat history:", err);
            } finally {
              setIsLoading(false);
            }
          };
          fetchThread();
        }
      } else {
        // activeThreadId is null/undefined
        
        if (threadId && !hasSentNewMessage) {
          // If we loaded an existing thread but haven't interacted with it, 
          // the user just viewed it. Clear it out and start a fresh chat.
        } else if (messages.length > 0) {
          // If we have a brand new chat going, or an actively modified past chat, resume it!
          return;
        }

        // Otherwise, start a brand new chat
        setMessages([]);
        setFollowups([]);
        setInputMessage("");
        setHasStarted(false);
        setHasSentNewMessage(false);
        setThreadId(null);

        // Tailor welcome message and follow-ups to the current plant context
        const plantName = plantContext?.common_name;
        const welcomeText = plantName
          ? `Hello! I'm your AI Botanical Guide. You've just identified **${plantName}** (*${plantContext.scientific_name}*). What would you like to know about it? 🌿`
          : `Hello! I'm your AI Botanical Guide. Ask me anything about plants — identification, cultivation, ecology, conservation, and more. I'm here to help! 🌿`;

        const contextFollowups = plantName
          ? [
              `What is the ecological role of ${plantName}?`,
              `Is ${plantName} suitable for home cultivation?`,
              `What are the conservation efforts for ${plantName}?`,
            ]
          : [
              "What plants are native to South India?",
              "How do I identify a plant I found?",
              "Which plants are best for home gardening in India?",
            ];

        setTimeout(() => {
          setMessages([{
            id: Date.now(),
            sender: "botanist",
            text: welcomeText,
            isWelcome: true,
          }]);
          setFollowups(contextFollowups);
        }, 300);
      }
    }
  }, [isOpen, activeThreadId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setHasSentNewMessage(true);
    const userMsg = { id: Date.now(), sender: "user", text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage("");
    setFollowups([]);
    setIsLoading(true);

    try {
      const plantId = plantContext?.plant_id ?? "";
      const data = await askBotanistGuide(plantId, query);
      const botMsg = { id: Date.now() + 1, sender: "botanist", text: data.reply_text };
      setMessages([
        ...updatedMessages,
        botMsg,
      ]);
      setFollowups(data.suggested_followup_queries || []);

      // Save to Firestore
      if (currentUser?.uid) {
        if (!threadId) {
          // Create new thread
          const threadRef = await addDoc(collection(db, "chat_threads"), {
            user_id: currentUser.uid,
            plant_id: plantId,
            plant_name: data.chat_title || plantContext?.common_name || "General Inquiry",
            created_at: serverTimestamp(),
            messages: [
              ...updatedMessages,
              botMsg
            ]
          });
          setThreadId(threadRef.id);
          window.dispatchEvent(new CustomEvent("aranya:refresh-chats"));
        } else {
          // Update existing thread
          const threadRef = doc(db, "chat_threads", threadId);
          await updateDoc(threadRef, {
            messages: [
              ...updatedMessages,
              botMsg
            ],
            updated_at: serverTimestamp()
          });
        }
      }
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
          {/* Rich plant data card rendered as first message when context is available */}
          {plantContext && <PlantContextCard plantContext={plantContext} />}
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

// ── PlantContextCard ─────────────────────────────────────────────────────────
// Rich plant data card rendered as the first item in the chat message body.
// Uses the same light-theme colours as the rest of the chat sheet.

const STATUS_COLORS = {
  "Critically Endangered": { bg: "#fff1f0", border: "#f5a09a", text: "#c0392b" },
  "Endangered":            { bg: "#fff7e6", border: "#f5c97a", text: "#a05f00" },
  "Vulnerable":            { bg: "#fffbe6", border: "#ffe58f", text: "#7a6000" },
  "Threatened":            { bg: "#fff7e6", border: "#f5c97a", text: "#a05f00" },
  "Native":                { bg: "#f0faf2", border: "#7cc48a", text: "#1a6b30" },
  "default":               { bg: "#f0faf2", border: "#b7dbbf", text: "#2a5e38" },
};

function DataRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingBottom: "0.55rem", borderBottom: "1px solid rgba(42,62,52,0.07)", marginBottom: "0.55rem" }}>
      <span style={{ fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#a08355" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.82rem", color: "#1a2e26", lineHeight: 1.45, fontFamily: "sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

function PlantContextCard({ plantContext: p }) {
  const statusStyle = STATUS_COLORS[p.conservation_status] ?? STATUS_COLORS["default"];

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(42,62,52,0.12)",
        borderRadius: "1rem",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        marginBottom: "0.25rem",
        fontFamily: "sans-serif",
      }}
      aria-label="Identified plant details"
    >
      {/* Card header */}
      <div style={{ background: "linear-gradient(135deg, #edf5ee 0%, #f5f3eb 100%)", padding: "0.85rem 1rem 0.75rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4a7c59", marginBottom: "0.25rem" }}>
              🌿 Identified Plant
            </p>
            <h3 style={{ margin: 0, fontSize: "1rem", fontFamily: "serif", fontWeight: 700, color: "#1a2e26", lineHeight: 1.2 }}>
              {p.common_name}
            </h3>
            {p.scientific_name && (
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", fontStyle: "italic", color: "#5a7a62", lineHeight: 1.3 }}>
                {p.scientific_name}
              </p>
            )}
          </div>
          {p.conservation_status && (
            <span style={{
              flexShrink: 0,
              fontSize: "0.65rem",
              fontWeight: 700,
              fontFamily: "monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "0.25rem 0.55rem",
              borderRadius: "9999px",
              background: statusStyle.bg,
              border: `1px solid ${statusStyle.border}`,
              color: statusStyle.text,
              whiteSpace: "nowrap",
            }}>
              {p.conservation_status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
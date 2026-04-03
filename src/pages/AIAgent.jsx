import React, { useState, useRef, useEffect } from "react";
import "./AIAgent.css";

/* ─── Suggested prompts ─── */
const suggestions = [
  "Book a plumber near me",
  "Find an electrician for tomorrow",
  "Schedule a deep cleaning service",
  "Get a carpenter for furniture repair",
];

/* ─── Typing indicator ─── */
// FIX: was "chat-message ai typing-indicator" — no such class exists in CSS
// Corrected to use the actual CSS classes: chat-bubble-wrap ai + chat-bubble ai + typing-indicator
function TypingIndicator() {
  return (
    <div className="chat-bubble-wrap ai">
      <div className="bubble-avatar">AI</div>
      <div className="chat-bubble ai typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}

const AIAgent = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      sender: "ai",
      text: "Hi! I'm Hukoom AI — your personal service assistant. Tell me what you need and I'll help you find the right professional instantly. 🛠️",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const handleSend = async (text) => {
    const prompt = (text || message).trim();
    if (!prompt || loading) return;

    setChat((prev) => [...prev, { sender: "user", text: prompt }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setChat((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="aiagent-page">

      {/* ── Background ── */}
      <div className="aiagent-bg">
        <div className="aiagent-orb aiagent-orb-1"></div>
        <div className="aiagent-orb aiagent-orb-2"></div>
        <div className="aiagent-grid"></div>
      </div>

      {/* FIX: removed "section-container" — that class belongs to a global CSS
          file that may not exist, and conflicts with the local grid layout */}
      <div className="aiagent-layout">

        {/* ── Left: intro panel ── */}
        <aside className="aiagent-intro">
          <div className="ai-logo-wrap">
            <div className="ai-logo-ring">
              <div className="ai-logo-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
                  <circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>
                </svg>
              </div>
            </div>
            <div className="ai-status-dot"></div>
          </div>

          <h1 className="aiagent-title">
            Hukoom
            <span className="hero-highlight"> AI Assistant</span>
          </h1>
          <p className="aiagent-desc">
            Your smart service companion — powered by AI to find, book, and manage local professionals instantly.
          </p>

          <div className="aiagent-capabilities">
            {[
              { icon: "⚡", text: "Instant service matching" },
              { icon: "📅", text: "Smart booking suggestions" },
              { icon: "🔍", text: "Provider availability checks" },
              { icon: "💬", text: "24/7 support assistance" },
            ].map((cap, i) => (
              <div className="capability-row" key={i}>
                <span className="capability-icon">{cap.icon}</span>
                <span className="capability-text">{cap.text}</span>
              </div>
            ))}
          </div>

          <div className="aiagent-hint">
            <span className="hint-tag">Try asking</span>
            <div className="suggestions-list">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSend(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right: chat panel ── */}
        <div className="chat-panel">

          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
                  <circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>
                </svg>
              </div>
              <div>
                <span className="chat-header-name">Hukoom AI</span>
                <span className="chat-header-status">
                  <span className="status-dot-sm"></span>
                  Online
                </span>
              </div>
            </div>
            <div className="chat-header-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Powered by AI
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {chat.map((msg, i) => (
              <div key={i} className={`chat-bubble-wrap ${msg.sender}`}>
                {msg.sender === "ai" && (
                  <div className="bubble-avatar">AI</div>
                )}
                <div className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-wrap">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask for any service..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="chat-input"
              />
              <button
                className={`send-btn ${message.trim() ? "active" : ""}`}
                onClick={() => handleSend()}
                disabled={!message.trim() || loading}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p className="chat-input-hint">Press Enter to send · Shift+Enter for new line</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIAgent;
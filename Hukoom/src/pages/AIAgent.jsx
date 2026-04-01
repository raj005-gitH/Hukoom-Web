import React, { useState } from "react";
import "./AIAgent.css";

const AIAgent = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: "user", text: message };
    setChat((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("http://localhost:5000/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: message }),
      });

      const data = await res.json();

      const aiMessage = {
        sender: "ai",
        text: data.reply,
      };

      setChat((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
    }

    setMessage("");
  };

  return (
    <div className="ai-container">
      <h2>🤖 Hukoom AI Assistant</h2>

      <div className="chat-box">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.sender === "user" ? "user" : "ai"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-box">
        <input
          type="text"
          placeholder="Ask for any service..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default AIAgent;
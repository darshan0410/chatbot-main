/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./AITutor.css";

const AITutor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickReplies = [
    "Show all courses",
    "Recommend beginner courses",
    "What are course prices?",
    "Who are the course authors?",
    "How to enroll?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const messageToSend = text || input;
    if (!messageToSend.trim() || loading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      text: messageToSend,
      sender: "user"
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // ✅ ALWAYS CALL BACKEND
      const response = await axios.post(
        "http://localhost:5000/api/chat/message",
        {
          userId: "lms-user",
          sessionId: "lms-session",
          message: messageToSend
        }
      );

      // 🔥 Adjust this depending on your backend response structure
      const botResponse =
        response.data?.reply || // if backend sends { reply: "text" }
        response.data?.data?.assistantMessage?.content ||
        "Sorry, I couldn't process that.";

      const botMessage = {
        id: crypto.randomUUID(),
        text: botResponse,
        sender: "bot"
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: "⚠️ Server connection failed.",
          sender: "bot"
        }
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {!isOpen && (
        <div className="chat-toggle" onClick={() => setIsOpen(true)}>
          💬
        </div>
      )}

      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <div>
              <h3>AI Tutor</h3>
              <span className="online-dot"></span> We’re online!
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="chat-body">
            {messages.length === 0 && (
              <>
                <div className="bot-message">
                  👋 Hi! I’m your LMS AI Tutor.
                  Ask me about courses, prices, authors, or recommendations.
                </div>

                <div className="quick-replies">
                  {quickReplies.map((reply, idx) => (
                    <button key={idx} onClick={() => sendMessage(reply)}>
                      {reply}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.sender === "user"
                    ? "user-message"
                    : "bot-message"
                }
              >
                {/* 🔥 PRESERVE LINE BREAKS */}
                {msg.text.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            ))}

            {loading && <div className="bot-message">Typing...</div>}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="chat-footer">
            <input
              type="text"
              placeholder="Enter your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={() => sendMessage()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AITutor;
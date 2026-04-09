/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
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
    mermaid.initialize({ startOnLoad: true });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => mermaid.init(), 200);
  }, [messages]);

  // 🔥 Extract courses for cards
  const extractCourses = (text) => {
    const courseRegex =
    /\d+\.\s(.+?)\n- Price: ₹(.+?)\n- Author: (.+?)\n- Level: (.+?)\n- Description: (.+?)\n- Link: (.+)/g;

    let matches;
    const courses = [];

    while ((matches = courseRegex.exec(text)) !== null) {
      courses.push({
        title: matches[1],
        price: matches[2],
        author: matches[3],
        level: matches[4],
        description: matches[5],
        link: matches[6]
      });
    }

    return courses;
  };

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
      const response = await axios.post(
        "http://localhost:5000/api/chat/message",
        {
          userId: "lms-user",
          sessionId: "lms-session",
          message: messageToSend
        }
      );

      const botResponse =
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

            {/* 🔥 WELCOME */}
            {messages.length === 0 && (
              <>
                <div className="bot-message">
                  <strong>👋 AI Tutor</strong>
                  <br />
                  I can help you with:
                  <ul>
                    <li>📚 Course recommendations</li>
                    <li>💰 Pricing details</li>
                    <li>👨‍🏫 Authors info</li>
                    <li>🚀 Learning roadmaps</li>
                  </ul>
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

            {/* 🔥 MESSAGES */}
            {messages.map((msg) => {
              const courses = extractCourses(msg.text);

              return (
                <div
                  key={msg.id}
                  className={msg.sender === "user" ? "user-message" : "bot-message"}
                >
                  {msg.sender === "bot" ? (
                    courses.length > 0 ? (
                      <div>
                        {courses.map((course, i) => (
                          <div key={i} style={{
                            border: "1px solid #eee",
                            borderRadius: "10px",
                            padding: "10px",
                            marginBottom: "8px",
                            background: "#fff"
                          }}>
                            <strong>{course.title}</strong>
                            <div>💰 ₹{course.price}</div>
                            <div>👨‍🏫 {course.author}</div>
                            <div>📊 {course.level}</div>
                            <p style={{ fontSize: "12px" }}>{course.description}</p>

                            <a
                                href={course._id}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                marginTop: "8px",
                                padding: "8px 14px",
                                background: "linear-gradient(135deg, #6366f1, #9333ea)",
                                color: "#fff",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600",
                                textDecoration: "none",
                                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
                                transition: "all 0.2s ease",
                                cursor: "pointer"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
                                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,0.5)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.35)";
                                }}
                                >
                                  🚀 Enroll Now
                                </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ReactMarkdown
                        components={{
                          h3: ({node, ...props}) => (
                            <div style={{
                              background: "linear-gradient(135deg, #6366f1, #9333ea)",
                              color: "#fff",
                              padding: "6px 10px",
                              borderRadius: "10px",
                              fontWeight: "bold",
                              fontSize: "13px",
                              marginBottom: "8px"
                            }} {...props} />
                          ),

                          img: ({node, ...props}) => (
                            <img {...props} style={{ width: "100%", borderRadius: "10px" }} />
                          ),

                          code: ({node, inline, className, children}) => {
                            if (className === "language-mermaid") {
                              return <div className="mermaid">{children}</div>;
                            }
                            return <code>{children}</code>;
                          }
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    )
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              );
            })}

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
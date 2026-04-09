// src/controllers/chatController.js

const ChatMessage = require("../models/ChatMessage");
const Course = require("../models/Course");
const groqService = require("../services/groqService");

class ChatController {

  async sendMessage(req, res) {
    try {
      const { message, userId, sessionId } = req.body;

      // ✅ Validation
      if (!message || !userId || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "message, userId and sessionId are required"
        });
      }

      // ✅ Save user message
      await ChatMessage.create({
        userId,
        sessionId,
        role: "user",
        content: message
      });

      // ✅ Get last 10 messages
      const recentMessages = await ChatMessage.find({ userId, sessionId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const conversationHistory = recentMessages
        .reverse()
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // ✅ Fetch Courses
      const courses = await Course.find().lean();

      let formattedCourses = "No courses available.";

      if (courses.length > 0) {
        formattedCourses = courses.map((course, index) => `
${index + 1}. ${course.title}
- Price: ₹${course.price}
- Author: ${course.author}
- Level: ${course.level}
- Description: ${course.description}
- Link: http://localhost:3000/course/${course._id}
`).join("\n");
      }

      // ✅ System Prompt (AI Tutor + LMS)
      const systemPrompt = `
You are an AI Tutor for an LMS website.

RULES:
- Always respond in structured bullet points.
- Only use the course data provided below.
- If no relevant course found, say so clearly.

AVAILABLE COURSES:
${formattedCourses}
`;

      // ✅ Call Groq Service (IMPORTANT CHANGE)
      const aiResponse = await groqService.chat([
        { role: "system", content: systemPrompt },
        ...conversationHistory
      ]);

      if (!aiResponse.success) {
        return res.status(500).json({
          success: false,
          error: aiResponse.error
        });
      }

      const aiMessage = aiResponse.message;

      // ✅ Save AI response
      await ChatMessage.create({
        userId,
        sessionId,
        role: "assistant",
        content: aiMessage,
        metadata: {
          model: aiResponse.model
        }
      });

      // ✅ Send response
      res.json({
        success: true,
        data: {
          assistantMessage: {
            content: aiMessage
          }
        }
      });

    } catch (error) {
      console.error("Chat Controller Error:", error.message);

      res.status(500).json({
        success: false,
        error: "AI response failed"
      });
    }
  }

  // ===============================
  // GET CHAT HISTORY
  // ===============================
  async getHistory(req, res) {
    try {
      const { userId, sessionId } = req.params;
      const { limit = 50 } = req.query;

      const query = { userId };

      if (sessionId) {
        query.sessionId = sessionId;
      }

      const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: messages.reverse()
      });

    } catch (error) {
      console.error("Get History Error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to fetch chat history"
      });
    }
  }

  // ===============================
  // DELETE SESSION
  // ===============================
  async deleteSession(req, res) {
    try {
      const { userId, sessionId } = req.params;

      await ChatMessage.deleteMany({ userId, sessionId });

      res.json({
        success: true,
        message: "Session deleted successfully"
      });

    } catch (error) {
      console.error("Delete Session Error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to delete session"
      });
    }
  }
}

module.exports = new ChatController();
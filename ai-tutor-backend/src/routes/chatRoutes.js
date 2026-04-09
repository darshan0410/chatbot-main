// src/routes/chatRoutes.js

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// ===============================
// CHAT ROUTES
// ===============================

// ✅ Send message to AI
router.post("/message", chatController.sendMessage);

// ✅ Get full chat history (all sessions)
router.get("/history/:userId", chatController.getHistory);

// ✅ Get specific session history
router.get("/history/:userId/session/:sessionId", chatController.getHistory);

// ✅ Delete a chat session
router.delete("/session/:userId/:sessionId", chatController.deleteSession);

module.exports = router;
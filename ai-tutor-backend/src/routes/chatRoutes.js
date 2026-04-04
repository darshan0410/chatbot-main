// src/routes/chatRoutes.js

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// Send message
router.post("/message", chatController.sendMessage);
router.get("/history/:userId", chatController.getHistory);
router.get("/history/:userId/session/:sessionId", chatController.getHistory);
router.delete("/session/:userId/:sessionId", chatController.deleteSession);

module.exports = router;
// src/models/ChatMessage.js

const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true // 🔥 faster queries
    },

    sessionId: {
      type: String,
      required: true,
      index: true // 🔥 important for session-based chat
    },

    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true // 🔥 removes extra spaces
    },

    metadata: {
      model: { type: String },
      tokens: { type: Number },
      responseTime: { type: Number } // optional performance tracking
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// 🔥 Compound Index (VERY IMPORTANT)
chatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
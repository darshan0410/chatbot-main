// src/routes/interviewRoutes.js

const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Parse directly in memory

// ===============================
// INTERVIEW ROUTES
// ===============================

// ✅ Upload Resume File and extract text
router.post("/upload-resume", upload.single("resume"), interviewController.uploadResume);

// ✅ Extract structured data from Resume
router.post("/extract-resume", interviewController.extractResume);

// ✅ Generate 5 interview questions based on prompt
router.post("/generate-questions", interviewController.generateQuestions);

// ✅ Submit an answer and get JSON evaluated scores
router.post("/submit-answer", interviewController.submitAnswer);

module.exports = router;

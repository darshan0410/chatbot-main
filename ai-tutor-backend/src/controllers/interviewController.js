// src/controllers/interviewController.js

const interviewService = require("../services/interviewService");

const fs = require('fs');
const pdfParse = require('pdf-parse');
const pdf = pdfParse.default || pdfParse; // handle both ESM default and CJS exports

class InterviewController {

  async uploadResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      const dataBuffer = req.file.buffer;

      let text = "";
      if (req.file.mimetype === "application/pdf") {
        const data = await pdf(dataBuffer);
        text = data.text;
      } else {
        // Fallback for plain text files
        text = dataBuffer.toString();
      }

      res.json({ success: true, text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async extractResume(req, res) {
    try {
      const { resumeText } = req.body;
      if (!resumeText) return res.status(400).json({ success: false, error: "Resume text required" });

      const messages = [
        {
          role: "system",
          content: `
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`
        },
        { role: "user", content: resumeText }
      ];

      const aiResponse = await interviewService.chat(messages, true);
      if (!aiResponse.success) return res.status(500).json(aiResponse);
      
      const parsed = JSON.parse(aiResponse.message);
      res.json({ success: true, data: parsed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async generateQuestions(req, res) {
    try {
      const { role, experience, mode, projectText, skillsText, safeResume } = req.body;

      const userPrompt = `
    Role:${role || 'Software Engineer'}
    Experience:${experience || '2 years'}
    InterviewMode:${mode || 'Technical'}
    Projects:${projectText || 'None'}
    Skills:${skillsText || 'JavaScript, React, Node.js'},
    Resume:${safeResume || 'Not provided'}
    `;

      const messages = [
        {
          role: "system",
          content: `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy  
Question 2 → easy  
Question 3 → medium  
Question 4 → medium  
Question 5 → hard  

Make questions based on the candidate’s role, experience,interviewMode, projects, skills, and resume details.
`
        },
        { role: "user", content: userPrompt }
      ];

      const aiResponse = await interviewService.chat(messages, false);
      if (!aiResponse.success) return res.status(500).json(aiResponse);

      const questions = aiResponse.message
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      res.json({ success: true, questions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async submitAnswer(req, res) {
    try {
      const { question, answer } = req.body;
      if (!question || !answer) return res.status(400).json({ success: false, error: "Question and answer required" });

      const messages = [
        {
          role: "system",
          content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`
        },
        { role: "user", content: `Question: ${question}\nAnswer: ${answer}` }
      ];

      const aiResponse = await interviewService.chat(messages, true);
      if (!aiResponse.success) return res.status(500).json(aiResponse);
      
      const parsed = JSON.parse(aiResponse.message);
      res.json({ success: true, data: parsed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

}

module.exports = new InterviewController();

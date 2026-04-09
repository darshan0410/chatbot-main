// src/services/interviewService.js
const Groq = require("groq-sdk");

class InterviewService {
  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.model = "llama-3.3-70b-versatile";
  }

  async chat(messages, jsonMode = false) {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.5,
        max_tokens: 1024,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      });

      return {
        success: true,
        message: completion.choices[0].message.content,
        model: this.model
      };

    } catch (error) {
      console.error("Groq Interview Error:", error.message);

      return {
        success: false,
        error: "Failed to get AI response",
        status: 500
      };
    }
  }
}

module.exports = new InterviewService();

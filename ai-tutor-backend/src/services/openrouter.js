// src/services/openrouter.js
const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = 'google/gemma-3-27b-it:free';  // Working free model
    // Alternative free models:
    // 'deepseek/deepseek-chat:free'
    // 'mistralai/mistral-7b-instruct:free'
    // 'meta-llama/llama-3.2-3b-instruct:free'
  }

  async chat(messages) {
    try {
      console.log('Sending to OpenRouter with model:', this.model); // Debug log
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5000',
            'X-Title': 'AI Tutor',
          },
        }
      );

      return {
        success: true,
        message: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      console.error('OpenRouter API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to get AI response',
        status: error.response?.status || 500
      };
    }
  }
}

module.exports = new OpenRouterService();
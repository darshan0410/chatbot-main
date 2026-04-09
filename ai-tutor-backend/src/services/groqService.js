// src/services/groqService.js
const Groq = require("groq-sdk");

class GroqService {
  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.model = "llama-3.3-70b-versatile";
  }

  async chat(messages) {
    try {
      const formattedMessages = this.formatMessages(messages);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages,
        temperature: 0.5,
        max_tokens: 1000,
      });

      return {
        success: true,
        message: completion.choices[0].message.content,
        model: this.model
      };

    } catch (error) {
      console.error("Groq Error:", error.message);

      return {
        success: false,
        error: "Failed to get AI response",
        status: 500
      };
    }
  }

  formatMessages(messages) {
    const systemPrompt = {
      role: "system",
      content: `
You are an AI Tutor for a Learning Management System.

🔥 FORMATTING RULES:

1. STRUCTURE:
- Start with ### Main Title
- Use ## for sections
- Use bullet points (-)
- Use indentation for tree/roadmap

2. TREE / ROADMAP:
- Use nested bullets:
- Topic
  - Subtopic
    - Detail

3. COURSE LINKS:
- ALWAYS use:
[Enroll Now](course_link)
- NEVER show raw URLs

4. DIAGRAMS (IMPORTANT):
- Use Mermaid when explaining flow:

Example:
\`\`\`mermaid
graph TD
A[Start] --> B[Learn HTML]
B --> C[Learn CSS]
C --> D[Learn JS]
\`\`\`

5. IMAGES:
- Add helpful images:
![topic](https://source.unsplash.com/400x200/?technology)

6. CLEAN UI:
- Keep spacing
- Avoid long paragraphs
- Keep content readable

🔥 OUTPUT FORMAT:

### Title

## Section

- Point
  - Subpoint

(Use diagrams/images when useful)
`
    };

    return [systemPrompt, ...messages];
  }
}

module.exports = new GroqService();
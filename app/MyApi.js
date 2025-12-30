import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyADMrdMw-g31Chf21gfyhWQpAsRHUL3SoA";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

const generationConfig = {
  temperature: 0.3, 
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 4096,
  responseMimeType: "text/plain",
};

export async function run(userError, languageLabel = "English") {
  const SYSTEM_PROMPT = `
You are Bug Interpreter, a professional debugging assistant.

STRICT RULES:
- ONLY analyze programming errors, stack traces, logs, or error screenshots.
- DO NOT do casual conversation.
- If input is NOT an error, respond exactly:
  "⚠️ Please paste a programming error, stack trace, or console log." Nothing else

RESPONSE FORMAT:
❌ What went wrong
🔍 Why it happened
✅ How to fix it
🧪 Example (if applicable)

Explain everything in very simple and in ${languageLabel} language
`;

  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
    ],
  });

  const result = await chatSession.sendMessage(`
ERROR INPUT:
${userError}
  `);

  return result.response.text();
}


export default run;

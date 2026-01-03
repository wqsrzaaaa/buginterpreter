import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generationConfig = {
  temperature: 0.3,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 4096,
  responseMimeType: "text/plain",
};


export async function run(
  userError,
  languageLabel = "English",
  imageBase64 = null
) {
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

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
  });

  const messageParts = [
    { text: SYSTEM_PROMPT },
    { text: userError },
  ];

  if (imageBase64) {
    const base64Data = imageBase64.split(",")[1];
    messageParts.push({
      inlineData: {
        mimeType: "image/png",
        data: base64Data,
      },
    });
  }

  // 3. Send the parts directly in sendMessage
  // We don't need history if we are sending everything in one go
  const result = await model.generateContent(messageParts);

  return result.response.text();
}


export default run;

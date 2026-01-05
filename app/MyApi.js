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
  maxOutputTokens: 1600,
  responseMimeType: "text/plain",
};

export async function run(userError, languageLabel = "English", imageInput = null) {
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

  const messageParts = [{ text: SYSTEM_PROMPT }, { text: userError }];

  // If an imageInput is provided:
  // - if it's a data URL (base64), keep the previous inlineData behaviour
  // - if it's an http(s) url (firebase link), pass a short instruction with the URL so the model can reference it
  if (imageInput) {
    if (typeof imageInput === "string" && imageInput.startsWith("data:")) {
      const base64Data = imageInput.split(",")[1];
      messageParts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      });
    } else if (typeof imageInput === "string" && (imageInput.startsWith("http://") || imageInput.startsWith("https://"))) {
      // Provide the URL as a separate part so the model can fetch / reference it if capable
      messageParts.push({
        text: `Image URL: ${imageInput}\n(Use this screenshot to analyze the error.)`,
      });
    } else {
      // fallback: include whatever was passed as text
      messageParts.push({ text: `Image reference: ${String(imageInput)}` });
    }
  }

  const result = await model.generateContent(messageParts, { generationConfig });
  return result.response.text();
}

export default run;

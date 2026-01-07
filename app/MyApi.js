import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generationConfig = {
  temperature: 0.2,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 1200,
  responseMimeType: "application/json",
};


export async function run(userError, languageLabel = "English", imageInput = null) {
  const SYSTEM_PROMPT = `
You are DebugSense, an expert AI debugging agent.

STRICT RULES:
- You MUST respond ONLY with valid JSON.
- Do NOT include markdown, emojis, explanations, or text outside JSON.
- If the input is NOT a programming error, return this exact JSON:

{
  "error": "INVALID_INPUT",
  "message": "Please paste a programming error, stack trace, or console log."
}

TASK:
Analyze the provided programming error, code, and optional screenshot.

Return JSON in the following EXACT schema:

{
  "errorType": "string",
  "rootCause": "string",
  "location": {
    "file": "string | null",
    "line": "number | null"
  },
  "fixes": [
    {
      "type": "minimal | best_practice",
      "patch": "string",
      "explanation": {
        "beginner": "string",
        "intermediate": "string",
        "advanced": "string"
      },
      "confidence": "number"
    }
  ],
  "diagnosticSteps": ["string"],
  "followUpQuestions": ["string"]
}

Use simple ${languageLabel} language.
`;


   try {
    const result = await model.generateContent(messageParts, { generationConfig });

    const rawText = result.response.text();

    // Try parsing JSON
    const parsed = JSON.parse(rawText);

    return {
      ok: true,
      data: parsed,
      raw: rawText,
    };

  } catch (error) {
    return {
      ok: false,
      error: "MODEL_RESPONSE_ERROR",
      message: "Failed to parse AI response.",
    };
  }
}

export default run;

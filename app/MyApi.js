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
  maxOutputTokens: 2200,
  responseMimeType: "application/json",
};

// Robust JSON parser
function parseJSONSafely(raw) {
  if (!raw) return null;
  try {
    // Try parsing the whole string first
    return JSON.parse(raw);
  } catch {
    // fallback: match first {...} block
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function run(userError, languageLabel = "English", imageBase64 = null) {
  const SYSTEM_PROMPT = `
You are DebugSense, an expert AI debugging agent.

STRICT RULES:
- You MUST respond ONLY with valid JSON.
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
    const safeError = userError.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: SYSTEM_PROMPT + "\n\nUSER ERROR:\n" + safeError + (imageBase64 ? `\n\nIMAGE_BASE64:\n${imageBase64}` : "")
            }
          ],
        },
      ],
      generationConfig,
    });

    const rawText = result.response.text().trim();

    const parsed = parseJSONSafely(rawText) || {
      errorType: "UNSTRUCTURED_RESPONSE",
      rootCause: "AI did not return valid JSON or response was truncated.",
      location: { file: null, line: null },
      fixes: [],
      diagnosticSteps: [],
      followUpQuestions: ["Please provide the full error text."],
    };

    // Debug logs
    console.log("raw start ----", rawText);
    console.log("parsed start ----", JSON.stringify(parsed, null, 2));

    return { ok: true, data: parsed, raw: rawText };
  } catch (err) {
    console.error("AI PARSE ERROR:", err);
    return { ok: false, error: "MODEL_RESPONSE_ERROR", message: err.message };
  }
}

export default run;

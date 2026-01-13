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
- Do NOT wrap JSON in markdown.
- Do NOT add explanations outside JSON.
- Keep responses SHORT.

LIMITS:
- Max 2 fixes
- Max 3 diagnosticSteps
- Max 2 followUpQuestions

If the input is NOT a programming error, return EXACTLY:

{
  "error": "INVALID_INPUT",
  "message": "Please paste a programming error, stack trace, or console log."
}

Return JSON in EXACT schema:
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

  // ---------- helpers ----------

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const looksLikeCompleteJSON = (text) =>
    text && text.trim().startsWith("{") && text.trim().endsWith("}");

  const safeFallback = (reason) => ({
    errorType: "UNSTRUCTURED_RESPONSE",
    rootCause: reason,
    location: { file: null, line: null },
    fixes: [],
    diagnosticSteps: [],
    followUpQuestions: ["Please retry or provide full error text."],
  });

  async function generateWithRetry(retries = 3) {
    let delay = 600;

    for (let i = 0; i < retries; i++) {
      try {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    SYSTEM_PROMPT +
                    "\n\nUSER ERROR:\n" +
                    userError +
                    (imageBase64 ? `\n\nIMAGE_BASE64:\n${imageBase64}` : ""),
                },
              ],
            },
          ],
          generationConfig,
        });
      } catch (err) {
        const msg = err?.message || "";

        if (!msg.includes("503") && i === retries - 1) {
          throw err;
        }

        console.warn(`Retry ${i + 1} due to model overload...`);
        await sleep(delay);
        delay *= 2;
      }
    }
  }

  // ---------- main ----------

  try {
    const result = await generateWithRetry(3);
    const rawText = result?.response?.text()?.trim() || "";

    console.log("raw start ----", rawText);

    if (!looksLikeCompleteJSON(rawText)) {
      console.warn("⚠️ Truncated or incomplete JSON detected");
      return {
        ok: true,
        data: safeFallback("Model returned truncated or incomplete JSON."),
        raw: rawText,
      };
    }

    const parsed = parseJSONSafely(rawText);

    if (!parsed) {
      console.warn("⚠️ JSON parse failed");
      return {
        ok: true,
        data: safeFallback("JSON parsing failed due to malformed response."),
        raw: rawText,
      };
    }

    console.log("parsed start ----", JSON.stringify(parsed, null, 2));

    return {
      ok: true,
      data: parsed,
      raw: rawText,
    };
  } catch (err) {
    console.error("AI MODEL ERROR:", err);
    return {
      ok: false,
      error: "MODEL_RESPONSE_ERROR",
      message: err.message || "Unknown model error",
    };
  }
}


export default run;

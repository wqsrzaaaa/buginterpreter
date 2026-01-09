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


function extractJSON(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  return text.slice(first, last + 1);
}


export async function run(userError, languageLabel = "English", imageBase64 = null, context = '') {
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
    const contextText = context?.length
      ? `PREVIOUS CONTEXT (for reference only):\n${context}`
      : "";

    const messageParts = [
      { text: SYSTEM_PROMPT },
      ...(contextText ? [{ text: contextText }] : []),
      { text: userError }
    ];

    if (imageBase64 && imageBase64.startsWith("data:")) {
      const base64Data = imageBase64.split(",")[1];
      messageParts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      });
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: messageParts,
        },
      ],
      generationConfig,
    });


    const rawText = result.response.text();
    const jsonText = extractJSON(rawText);

    let parsed = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = {
        errorType: "UNSTRUCTURED_RESPONSE",
        rootCause: "AI did not return valid JSON.",
        location: { file: null, line: null },
        fixes: [],
        diagnosticSteps: [],
        followUpQuestions: ["Please provide the full error text."]
      };
    }

    console.log(rawText);
    console.log(parsed);



    return {
      ok: true,
      data: parsed,
      raw: rawText,
    };

  } catch (error) {
    console.error("AI PARSE ERROR:", error);

    return {
      ok: false,
      error: "MODEL_RESPONSE_ERROR",
      message: error.message,
    };
  }
}


export default run;

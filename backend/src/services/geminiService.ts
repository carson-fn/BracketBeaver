import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env in non-production environments
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const apiKey = process.env.GEMINI_API_KEY;
// Allow overriding model, default to a supported flash model
const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let gemini: GoogleGenerativeAI | null = null;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set, Gemini requests will fail.");
} else {
  gemini = new GoogleGenerativeAI(apiKey);
}

export type GeminiPromptResult = {
  text: string;
  model: string;
  tokensUsed?: number;
};

export const runPrompt = async (prompt: string): Promise<GeminiPromptResult> => {
  if (!gemini) {
    throw new Error("Gemini API key not configured");
  }

  const model = gemini.getGenerativeModel({ model: modelName });

  try {
    // Send the prompt
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const tokensUsed = result.response.usageMetadata?.totalTokenCount;

    if (tokensUsed !== undefined) {
      return { text, model: modelName, tokensUsed };
    }
    return { text, model: modelName };

  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "status" in err) {
      const status = (err as { status?: number }).status;
      if (status === 404) {
        throw new Error(
          `Model ${modelName} not found. Update GEMINI_MODEL to a supported model for your API key.`
        );
      }
    }

    throw err;
  }

};

import type { Request, Response } from "express";
import { runPrompt } from "../services/geminiService.js";

// Demo to test prompts for now
// Once tournament generation is complete, this will be integrated
export const runGeminiDemo = async (req: Request, res: Response) => {
  const { prompt } = req.body ?? {};

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const result = await runPrompt(prompt);
    return res.json(result);
  } catch (err) {
    console.error("GEMINI DEMO ERROR:", err);

    const message =
      err instanceof Error
        ? err.message
        : "Gemini request failed. Verify GEMINI_API_KEY and GEMINI_MODEL.";

    return res.status(500).json({
      error: message,
      hint:
        "Ensure GEMINI_API_KEY is valid and GEMINI_MODEL (default gemini-2.5-flash) is supported. Try a smaller Flash/Pro variant if needed.",
    });
  }
};

import type { Request, Response } from "express";
import {
  generateTournamentSummary,
  isIncompleteTournamentError,
  isNotFoundError,
} from "../services/tournamentSummaryService.js";

const parseId = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const generateTournamentSummaryHandler = async (req: Request, res: Response) => {
  const tournamentId = parseId(req.params.id);

  if (!tournamentId) {
    return res.status(400).json({ success: false, message: "Invalid tournament id." });
  }

  try {
    const result = await generateTournamentSummary(tournamentId);
    return res.status(200).json({
      success: true,
      summary: result.summary,
      model: result.model,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    if (isIncompleteTournamentError(error)) {
      return res.status(400).json({
        success: false,
        message: "Tournament must be fully completed before generating a summary.",
      });
    }

    if (isNotFoundError(error)) {
      return res.status(404).json({ success: false, message: "Tournament not found." });
    }

    console.error("Failed to generate tournament summary:", error);
    return res.status(500).json({
      success: false,
      message:
        "Failed to generate summary. Ensure GEMINI_API_KEY is set and the model name is supported (GEMINI_MODEL).",
    });
  }
};

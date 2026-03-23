import type { Request, Response } from "express";
import {
  createTournament,
  generateTournamentSchedule,
  getTournamentBracket,
  getTournamentSchedule,
  updateTournamentMatchResult,
  type CreateTournamentPayload,
} from "../services/tournamentService.js";

const parseTournamentId = (idParam: string): number | null => {
  const parsed = Number(idParam);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseViewer = (req: Request): { userId: number; role: string } | null => {
  const rawUserId = req.query.userId;
  const rawRole = req.query.role;

  const userId = Number(rawUserId);
  const role = typeof rawRole === "string" ? rawRole.trim() : "";

  if (!Number.isInteger(userId) || userId <= 0 || !role) {
    return null;
  }

  return { userId, role };
};

export const createTournamentHandler = async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<CreateTournamentPayload>;

    if (
      typeof payload.name !== "string" ||
      typeof payload.sport !== "string" ||
      (payload.bracketType !== "single_elimination" && payload.bracketType !== "round_robin") ||
      typeof payload.startDate !== "string" ||
      typeof payload.endDate !== "string" ||
      typeof payload.createdBy !== "number" ||
      !Array.isArray(payload.teams) ||
      !Array.isArray(payload.venues)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body.",
      });
    }

    const result = await createTournament({
      name: payload.name,
      sport: payload.sport,
      bracketType: payload.bracketType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      createdBy: payload.createdBy,
      teams: payload.teams,
      venues: payload.venues,
    });

    return res.status(201).json({
      success: true,
      tournamentId: result.tournamentId,
    });
  } catch (error) {
    // Log the underlying error for diagnostics, but do not expose details to the client.
    console.error("Failed to create tournament:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const generateScheduleHandler = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (typeof idParam !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid tournament id.",
    });
  }

  const tournamentId = parseTournamentId(idParam);

  if (!tournamentId) {
    return res.status(400).json({
      success: false,
      message: "Invalid tournament id.",
    });
  }

  try {
    const result = await generateTournamentSchedule(tournamentId);
    return res.status(200).json({
      success: true,
      generatedMatches: result.generatedMatches,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Tournament not found.") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    // Log unexpected errors and return a generic server error response.
    console.error("Failed to generate tournament schedule:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getScheduleHandler = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (typeof idParam !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid tournament id.",
    });
  }

  const tournamentId = parseTournamentId(idParam);

  if (!tournamentId) {
    return res.status(400).json({
      success: false,
      message: "Invalid tournament id.",
    });
  }

  try {
    const schedule = await getTournamentSchedule(tournamentId);

    return res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error("Failed to get tournament schedule:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getBracketHandler = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (typeof idParam !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid tournament id.",
    });
  }

  const tournamentId = parseTournamentId(idParam);

  if (!tournamentId) {
    return res.status(400).json({
      success: false,
      message: "Invalid tournament id.",
    });
  }

  const viewer = parseViewer(req);

  if (!viewer) {
    return res.status(400).json({
      success: false,
      message: "userId and role query parameters are required.",
    });
  }

  try {
    const bracket = await getTournamentBracket(tournamentId, viewer);
    return res.status(200).json({ success: true, bracket });
  } catch (error) {
    if (error instanceof Error && error.message === "Tournament not found.") {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error instanceof Error && error.message === "Access denied.") {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error("Failed to get tournament bracket:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateMatchResultHandler = async (req: Request, res: Response) => {
  const tournamentIdParam = req.params.id;
  const matchIdParam = req.params.matchId;

  if (typeof tournamentIdParam !== "string" || typeof matchIdParam !== "string") {
    return res.status(400).json({ success: false, message: "Invalid route parameters." });
  }

  const tournamentId = parseTournamentId(tournamentIdParam);
  const matchId = parseTournamentId(matchIdParam);

  if (!tournamentId || !matchId) {
    return res.status(400).json({ success: false, message: "Invalid route parameters." });
  }

  const { homeScore, awayScore } = req.body as { homeScore?: number; awayScore?: number };

  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    return res.status(400).json({ success: false, message: "homeScore and awayScore are required." });
  }

  try {
    const result = await updateTournamentMatchResult(tournamentId, matchId, homeScore, awayScore);
    return res.status(200).json({ success: true, winnerTeamId: result.winnerTeamId });
  } catch (error) {
    if (error instanceof Error) {
      const knownMessages = new Set([
        "Match not found.",
        "Both teams must be known before submitting a result.",
        "Scores must be whole numbers greater than or equal to 0.",
        "Matches cannot end in a tie.",
      ]);

      if (knownMessages.has(error.message)) {
        const statusCode = error.message === "Match not found." ? 404 : 400;
        return res.status(statusCode).json({ success: false, message: error.message });
      }
    }

    console.error("Failed to update match result:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

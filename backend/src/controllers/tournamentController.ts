import type { Request, Response } from "express";
import {
  createTournament,
  generateTournamentSchedule,
  getTournamentBracket,
  getTournamentSchedule,
  updateTournamentMatchResult,
  listTournaments,
  deleteTournament,
  type CreateTournamentPayload,
} from "../services/tournamentService.js";
import { predictMatchOutcome } from "../services/matchPredictionService.js";

const parseTournamentId = (idParam: string): number | null => {
  const parsed = Number(idParam);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const createTournamentHandler = async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<CreateTournamentPayload>;

    console.log("CREATE TOURNAMENT: Received payload:", payload);

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
      console.log("CREATE TOURNAMENT: Validation failed - invalid types");
      console.log("  - createdBy type:", typeof payload.createdBy, "value:", payload.createdBy);
      return res.status(400).json({
        success: false,
        message: "Invalid request body.",
      });
    }

    console.log("CREATE TOURNAMENT: Type validation passed");
    console.log("  - createdBy:", payload.createdBy);

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

    console.log("CREATE TOURNAMENT: Success, tournament ID:", result.tournamentId);
    return res.status(201).json({
      success: true,
      tournamentId: result.tournamentId,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("CREATE TOURNAMENT: Error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.error("CREATE TOURNAMENT: Unexpected error:", error);
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

    if (error instanceof Error) {
      console.error("Failed to generate tournament schedule:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

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

  try {
    const bracket = await getTournamentBracket(tournamentId);
    return res.status(200).json({ success: true, bracket });
  } catch (error) {
    if (error instanceof Error && error.message === "Tournament not found.") {
      return res.status(404).json({ success: false, message: error.message });
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

export const getTournamentsHandler = async (req: Request, res: Response) => {
  try {
    const createdBy = req.query.createdBy ? parseInt(req.query.createdBy as string) : undefined;
    const tournaments = await listTournaments(createdBy);
    return res.status(200).json({ success: true, tournaments });
  } catch (error) {
    console.error("Failed to list tournaments:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteTournamentHandler = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (typeof idParam !== "string") {
    return res.status(400).json({ success: false, message: "Invalid tournament id." });
  }

  const tournamentId = parseTournamentId(idParam);

  if (!tournamentId) {
    return res.status(400).json({ success: false, message: "Invalid tournament id." });
  }

  try {
    const createdBy = req.body?.createdBy ? parseInt(req.body.createdBy) : undefined;
    await deleteTournament(tournamentId, createdBy);
    return res.status(200).json({ success: true, message: "Tournament deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Tournament not found.") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("do not have permission")) {
        return res.status(403).json({ success: false, message: error.message });
      }
    }

    console.error("Failed to delete tournament:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const predictMatchHandler = async (req: Request, res: Response) => {
  const tournamentIdParam = req.params.id;
  const matchIdParam = req.params.matchId;

  const tournamentId = parseTournamentId(tournamentIdParam ?? "");
  const matchId = parseTournamentId(matchIdParam ?? "");

  if (!tournamentId || !matchId) {
    return res.status(400).json({ success: false, message: "Invalid route parameters." });
  }

  try {
    const prediction = await predictMatchOutcome(tournamentId, matchId);
    return res.status(200).json({ success: true, prediction });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = error instanceof Error ? error.message : "Server error";

    if (status === 404 || status === 400 || status === 422) {
      return res.status(status).json({ success: false, message });
    }

    console.error("Failed to predict match outcome:", error);
    return res.status(500).json({ success: false, message: "Failed to generate prediction." });
  }
};

import type { Request, Response } from "express";
import {
  createTournament,
  generateTournamentSchedule,
  getTournamentSchedule,
  type CreateTournamentPayload,
} from "../services/tournamentService.js";

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

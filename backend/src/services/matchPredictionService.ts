import { getMatchById, getTournamentScheduleContext, countCompletedMatchesForTeam, getRecentCompletedMatchesForTeam, type TeamRecentMatch } from "../models/tournamentModel.js";
import { runPrompt } from "./geminiService.js";

type ParsedPrediction = {
  homeScore: number;
  awayScore: number;
  reason: string;
};

const formatHistoryLine = (match: TeamRecentMatch): string => {
  const margin = Math.abs(match.team_score - match.opponent_score);
  return `${match.match_time}: vs ${match.opponent} ${match.team_score}-${match.opponent_score} (${match.result}, margin ${margin})`;
};

const buildPrompt = (input: {
  tournamentName: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeHistory: TeamRecentMatch[];
  awayHistory: TeamRecentMatch[];
}): string => {
  const homeHistoryBlock = input.homeHistory.map(formatHistoryLine).join("\n");
  const awayHistoryBlock = input.awayHistory.map(formatHistoryLine).join("\n");

  return [
    `You are predicting the final score for an upcoming ${input.sport} match in the tournament ${input.tournamentName}.`,
    `Teams: ${input.homeTeam} (home) vs ${input.awayTeam} (away).`,
    "Use recent form only; prefer modest, realistic score margins.",
    "Do not return a tie score.",
    "Return ONLY strict JSON, no markdown, no code fences.",
    "Schema: { \"homeTeam\": string, \"awayTeam\": string, \"homeScore\": integer, \"awayScore\": integer, \"reason\": string }",
    "Where reason is one concise sentence about form/injuries/trends; keep it short.",
    "Recent results for context:",
    `${input.homeTeam}:`,
    homeHistoryBlock,
    `${input.awayTeam}:`,
    awayHistoryBlock,
    "Now respond with the JSON object only.",
  ].join("\n");
};

const tryParseJson = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (err) {
    // attempt to salvage JSON enclosed in fences
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw err;
  }
};

const coerceScore = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Number(value))) {
    return Math.max(0, Math.round(Number(value)));
  }
  throw new Error("Prediction response missing numeric scores.");
};

export const predictMatchOutcome = async (tournamentId: number, matchId: number) => {
  const match = await getMatchById(tournamentId, matchId);

  if (!match) {
    const error = new Error("Match not found.");
    (error as any).status = 404;
    throw error;
  }

  if (match.status !== "pending") {
    const error = new Error("Match already completed.");
    (error as any).status = 400;
    throw error;
  }

  if (match.home_team_id === null || match.away_team_id === null) {
    const error = new Error("Both teams must be set before predicting.");
    (error as any).status = 400;
    throw error;
  }

  const context = await getTournamentScheduleContext(tournamentId);
  if (!context) {
    const error = new Error("Tournament not found.");
    (error as any).status = 404;
    throw error;
  }

  const teamNameById = new Map(context.teams.map((team) => [team.teamid, team.name]));
  const homeName = teamNameById.get(match.home_team_id) ?? "Home";
  const awayName = teamNameById.get(match.away_team_id) ?? "Away";

  const [homeCount, awayCount] = await Promise.all([
    countCompletedMatchesForTeam(tournamentId, match.home_team_id),
    countCompletedMatchesForTeam(tournamentId, match.away_team_id),
  ]);

  if (homeCount < 1 || awayCount < 1) {
    const error = new Error("Each team needs at least one completed match before prediction.");
    (error as any).status = 422;
    throw error;
  }

  const [homeHistory, awayHistory] = await Promise.all([
    getRecentCompletedMatchesForTeam(tournamentId, match.home_team_id, 5),
    getRecentCompletedMatchesForTeam(tournamentId, match.away_team_id, 5),
  ]);

  const prompt = buildPrompt({
    tournamentName: context.name,
    sport: context.sport,
    homeTeam: homeName,
    awayTeam: awayName,
    homeHistory,
    awayHistory,
  });

  const llmResult = await runPrompt(prompt);

  let parsed: ParsedPrediction;
  try {
    const json = tryParseJson(llmResult.text);
    const homeScore = coerceScore(json.homeScore);
    const awayScore = coerceScore(json.awayScore);

    if (homeScore === awayScore) {
      throw new Error("Prediction returned a tie score, which is not allowed.");
    }

    parsed = {
      homeScore,
      awayScore,
      reason: typeof json.reason === "string" ? json.reason : "Predicted based on recent form.",
    };
  } catch (err) {
    console.error("Failed to parse Gemini prediction:", err);
    const error = new Error("Gemini response could not be parsed.");
    (error as any).status = 500;
    throw error;
  }

  return {
    ...parsed,
    model: llmResult.model,
    tokensUsed: llmResult.tokensUsed,
  };
};


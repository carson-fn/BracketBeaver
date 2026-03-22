import {
  getBracketByTournament,
  getTournamentScheduleContext,
  type BracketMatchRow,
  type TeamRow,
} from "../models/tournamentModel.js";
import { runPrompt, type GeminiPromptResult } from "./geminiService.js";

type Standing = {
  teamId: number;
  name: string;
  wins: number;
  losses: number;
  pointDiff: number;
};

type SummaryBuild = {
  champion: string;
  runnerUp: string;
  totalGames: number;
  averageMargin: number;
  closeGame: string;
  blowout: string;
  matchLines: string[];
  bracketType: string;
};

class NotFoundError extends Error {
  status = 404;
}

class IncompleteTournamentError extends Error {
  status = 400;
}

const ensureCompleted = (matches: BracketMatchRow[]) => {
  const incomplete = matches.find((match) => match.status !== "completed");
  if (incomplete) {
    throw new IncompleteTournamentError("Tournament still has pending matches.");
  }
};

const formatScoreLine = (match: BracketMatchRow): string => {
  const homeScore = match.home_score ?? "—";
  const awayScore = match.away_score ?? "—";
  const winner = match.winner_team ?? "TBD";

  return `Round ${match.round_number} / Match ${match.slot_number}: ${match.home_team} ${homeScore}-${awayScore} ${match.away_team} (winner ${winner})`;
};

const pickSingleEliminationPodium = (matches: BracketMatchRow[]) => {
  const totalRounds = matches.reduce((max, m) => Math.max(max, m.round_number), 0);
  const finals = matches.filter((m) => m.round_number === totalRounds);
  const finalMatch = finals[0];

  if (!finalMatch || !finalMatch.winner_team) {
    return { champion: "Unknown", runnerUp: "Unknown" };
  }

  const champion = finalMatch.winner_team;
  const runnerUp =
    finalMatch.winner_team_id === finalMatch.home_team_id ? finalMatch.away_team : finalMatch.home_team;

  return {
    champion,
    runnerUp: runnerUp ?? "Unknown",
  };
};

const initStandings = (teams: TeamRow[]): Record<number, Standing> =>
  teams.reduce<Record<number, Standing>>((map, team) => {
    map[team.teamid] = {
      teamId: team.teamid,
      name: team.name,
      wins: 0,
      losses: 0,
      pointDiff: 0,
    };
    return map;
  }, {});

const updateStandingsFromMatch = (standings: Record<number, Standing>, match: BracketMatchRow) => {
  const homeId = match.home_team_id;
  const awayId = match.away_team_id;
  const homeScore = match.home_score;
  const awayScore = match.away_score;

  if (
    homeId === null ||
    awayId === null ||
    homeScore === null ||
    awayScore === null ||
    !Number.isFinite(homeScore) ||
    !Number.isFinite(awayScore)
  ) {
    return;
  }

  const homeStanding = standings[homeId];
  const awayStanding = standings[awayId];
  if (!homeStanding || !awayStanding) return;

  homeStanding.pointDiff += homeScore - awayScore;
  awayStanding.pointDiff += awayScore - homeScore;

  if (homeScore > awayScore) {
    homeStanding.wins += 1;
    awayStanding.losses += 1;
  } else {
    awayStanding.wins += 1;
    homeStanding.losses += 1;
  }
};

const pickRoundRobinPodium = (teams: TeamRow[], matches: BracketMatchRow[]) => {
  const standings = initStandings(teams);

  matches.forEach((match) => updateStandingsFromMatch(standings, match));

  const ordered = Object.values(standings).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return a.name.localeCompare(b.name);
  });

  const champion = ordered[0]?.name ?? "Unknown";
  const runnerUp = ordered[1]?.name ?? "Unknown";

  return { champion, runnerUp };
};

const computeAggs = (matches: BracketMatchRow[]) => {
  const scored = matches.filter(
    (m) => m.home_score !== null && m.away_score !== null && m.status === "completed"
  );

  const margins = scored.map((m) => Math.abs((m.home_score ?? 0) - (m.away_score ?? 0)));
  const averageMargin =
    margins.length > 0 ? margins.reduce((sum, value) => sum + value, 0) / margins.length : 0;

  const byMarginAsc = [...scored].sort(
    (a, b) => Math.abs((a.home_score ?? 0) - (a.away_score ?? 0)) - Math.abs((b.home_score ?? 0) - (b.away_score ?? 0))
  );
  const byMarginDesc = [...byMarginAsc].reverse();

  const formatHighlight = (match: BracketMatchRow, label: string) => {
    if (!match) return `${label}: n/a`;
    const margin = Math.abs((match.home_score ?? 0) - (match.away_score ?? 0));
    return `${label}: ${match.match_label} - ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} (margin ${margin})`;
  };

  return {
    averageMargin,
    closeGame: formatHighlight(byMarginAsc[0], "Closest game"),
    blowout: formatHighlight(byMarginDesc[0], "Biggest win"),
  };
};

const buildPrompt = (
  tournament: {
    name: string;
    sport: string;
    bracketType: string;
    startDate: string | Date;
    endDate: string | Date;
    teams: TeamRow[];
  },
  summary: SummaryBuild
): string => {
  const teamList = tournament.teams.map((t) => t.name).join(", ");
  const matchLog = summary.matchLines.join("\n");

  return [
    `You are summarizing a completed ${tournament.sport} tournament.`,
    `Tournament: ${tournament.name}`,
    `Dates: ${tournament.startDate} to ${tournament.endDate}`,
    `Bracket type: ${tournament.bracketType}`,
    `Teams: ${teamList}`,
    "",
    "Key facts:",
    `- Champion: ${summary.champion}`,
    `- Runner-up: ${summary.runnerUp}`,
    `- Games played: ${summary.totalGames}`,
    `- Average margin: ${summary.averageMargin.toFixed(1)} points`,
    `- ${summary.closeGame}`,
    `- ${summary.blowout}`,
    "",
    "Matches:",
    matchLog,
    "",
    "Write a concise 3-6 sentence summary highlighting champion, runner-up, notable games, and overall narrative. Keep it factual and neutral; no HTML.",
  ].join("\n");
};

const buildSummaryFacts = (
  bracketType: string,
  teams: TeamRow[],
  matches: BracketMatchRow[]
): SummaryBuild => {
  const { champion, runnerUp } =
    bracketType === "single_elimination"
      ? pickSingleEliminationPodium(matches)
      : pickRoundRobinPodium(teams, matches);

  const { averageMargin, closeGame, blowout } = computeAggs(matches);

  return {
    champion,
    runnerUp,
    totalGames: matches.length,
    averageMargin,
    closeGame,
    blowout,
    matchLines: matches.map((m) => formatScoreLine(m)),
    bracketType,
  };
};

export const generateTournamentSummary = async (
  tournamentId: number
): Promise<GeminiPromptResult & { summary: string }> => {
  const context = await getTournamentScheduleContext(tournamentId);

  if (!context) {
    throw new NotFoundError("Tournament not found.");
  }

  const matches = await getBracketByTournament(tournamentId);
  ensureCompleted(matches);

  const facts = buildSummaryFacts(context.bracketType, context.teams, matches);
  const prompt = buildPrompt(
    {
      name: context.name,
      sport: context.sport,
      bracketType: context.bracketType,
      startDate: context.startDate,
      endDate: context.endDate,
      teams: context.teams,
    },
    facts
  );

  const result = await runPrompt(prompt);

  return {
    summary: result.text,
    model: result.model,
    tokensUsed: result.tokensUsed,
  };
};

export const isIncompleteTournamentError = (error: unknown): boolean =>
  error instanceof IncompleteTournamentError || (error instanceof Error && error.message.includes("pending matches"));

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof NotFoundError || (error instanceof Error && error.message.includes("not found"));

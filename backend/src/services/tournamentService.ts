import type { PoolClient } from "pg";
import {
  clearTournamentMatchesWithExecutor,
  createTournamentWithDetails,
  getBracketByTournament,
  getMatchById,
  getTournamentScheduleContext,
  insertTournamentMatch,
  findDependentMatch,
  resetMatchOutcome,
  saveMatchResult,
  setMatchParticipant,
  type CreateTournamentInput,
  type BracketMatchRow,
  type ScheduledMatchInsert,
} from "../models/tournamentModel.js";
import { pool } from "../database/database.js";

export type CreateTournamentPayload = {
  name: string;
  sport: string;
  bracketType: "single_elimination" | "round_robin";
  startDate: string;
  endDate: string;
  createdBy: number;
  teams: string[];
  venues: string[];
};

type BracketViewer = {
  userId: number;
  role: string;
};

const sanitizeList = (items: string[]): string[] => {
  return items
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidYyyyMmDd = (value: string): boolean => {
  if (!DATE_REGEX.test(value)) return false;

  // Use Date parsing to ensure the date actually exists (e.g. reject 2024-02-30).
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;

  // Ensure no overflow (e.g. 2024-13-01) by comparing the ISO prefix.
  return date.toISOString().startsWith(value);
};

const validateCreatePayload = (payload: CreateTournamentPayload): string | null => {
  if (!payload.name.trim()) return "Tournament name is required.";
  if (!payload.sport.trim()) return "Sport is required.";
  if (!payload.startDate || !payload.endDate) return "Start and end dates are required.";

  if (!isValidYyyyMmDd(payload.startDate) || !isValidYyyyMmDd(payload.endDate)) {
    return "Start and end dates must be valid dates in YYYY-MM-DD format.";
  }

  const start = new Date(`${payload.startDate}T00:00:00Z`);
  const end = new Date(`${payload.endDate}T00:00:00Z`);
  if (end.getTime() < start.getTime()) {
    return "End date cannot be before start date.";
  }

  if (!Number.isInteger(payload.createdBy) || payload.createdBy <= 0) {
    return "createdBy must be a positive integer.";
  }

  const teams = sanitizeList(payload.teams);
  const venues = sanitizeList(payload.venues);

  if (teams.length < 2) return "At least 2 teams are required.";
  if (venues.length < 1) return "At least 1 venue is required.";

  if (new Set(teams.map((team) => team.toLowerCase())).size !== teams.length) {
    return "Team names must be unique.";
  }

  if (new Set(venues.map((venue) => venue.toLowerCase())).size !== venues.length) {
    return "Venue names must be unique.";
  }

  return null;
};

export const createTournament = async (
  payload: CreateTournamentPayload
): Promise<{ tournamentId: number }> => {
  const validationError = validateCreatePayload(payload);
  if (validationError) {
    throw new Error(validationError);
  }

  const input: CreateTournamentInput = {
    ...payload,
    teams: sanitizeList(payload.teams),
    venues: sanitizeList(payload.venues),
  };

  const tournamentId = await createTournamentWithDetails(input);

  return { tournamentId };
};

type Pairing = {
  homeTeamId: number;
  awayTeamId: number;
};

type TeamSlot = {
  teamId: number | null;
};

const generateRoundRobinPairings = (teamIds: number[]): Pairing[][] => {
  const ids = [...teamIds];

  if (ids.length % 2 !== 0) {
    ids.push(-1);
  }

  const rounds: Pairing[][] = [];
  const totalRounds = ids.length - 1;
  const half = ids.length / 2;

  for (let round = 0; round < totalRounds; round++) {
    const pairings: Pairing[] = [];

    for (let index = 0; index < half; index++) {
      const home = ids[index];
      const away = ids[ids.length - 1 - index];

      if (typeof home === "number" && typeof away === "number" && home !== -1 && away !== -1) {
        pairings.push({
          homeTeamId: home,
          awayTeamId: away,
        });
      }
    }

    rounds.push(pairings);

    const fixed = ids[0];
    const rotating = ids.slice(1);
    const last = rotating.pop();

    if (last === undefined) {
      break;
    }

    if (fixed === undefined) {
      break;
    }

    ids.splice(0, ids.length, fixed, last, ...rotating);
  }

  return rounds;
};

const buildRoundStartTime = (startDate: string, roundIndex: number): Date => {
  const parts = startDate.split("-");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid startDate '${startDate}'; expected format YYYY-MM-DD.`
    );
  }

  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(
      `Invalid startDate '${startDate}'; expected format YYYY-MM-DD with a valid calendar date.`
    );
  }

  const base = new Date(Date.UTC(year, month - 1, day, 10, 0, 0, 0));
  if (Number.isNaN(base.getTime())) {
    throw new Error(
      `Invalid startDate '${startDate}'; could not construct a valid Date.`
    );
  }

  base.setUTCDate(base.getUTCDate() + roundIndex);
  return base;
};

const normalizeDateString = (value: string | Date): string => {
  if (typeof value === "string") {
    return value;
  }

  const isoDate = value.toISOString().split("T")[0];

  if (!isoDate) {
    throw new Error("Invalid start date format.");
  }

  return isoDate;
};

export const generateTournamentSchedule = async (
  tournamentId: number
): Promise<{ generatedMatches: number }> => {
  const context = await getTournamentScheduleContext(tournamentId);

  if (!context) {
    throw new Error("Tournament not found.");
  }

  if (context.teams.length < 2) {
    throw new Error("Tournament requires at least 2 teams.");
  }

  if (context.venues.length < 1) {
    throw new Error("Tournament requires at least 1 venue.");
  }

  const startDateStr = normalizeDateString(context.startDate);

  if (context.bracketType === "round_robin") {
    return generateRoundRobinSchedule(tournamentId, startDateStr, context.teams.map((team) => team.teamid), context.venues.map((venue) => venue.venueid));
  }

  if (context.bracketType === "single_elimination") {
    return generateSingleEliminationBracket(tournamentId, startDateStr, context.teams.map((team) => team.teamid), context.venues.map((venue) => venue.venueid));
  }

  throw new Error(`Unsupported bracket type: ${context.bracketType}`);
};

export const getTournamentSchedule = async (tournamentId: number) => {
  return getBracketByTournament(tournamentId);
};

const buildMatchTimestamp = (
  startDate: string,
  roundIndex: number,
  slotOffset: number
): string => {
  const roundStart = buildRoundStartTime(startDate, roundIndex);
  const matchTimestamp = new Date(
    Date.UTC(
      roundStart.getUTCFullYear(),
      roundStart.getUTCMonth(),
      roundStart.getUTCDate(),
      roundStart.getUTCHours() + slotOffset * 2,
      roundStart.getUTCMinutes(),
      roundStart.getUTCSeconds()
    )
  );

  return matchTimestamp.toISOString();
};

const nextPowerOfTwo = (value: number): number => {
  let power = 1;

  while (power < value) {
    power *= 2;
  }

  return power;
};

const buildSeedOrder = (size: number): number[] => {
  let seeds = [1];

  while (seeds.length < size) {
    const nextSize = seeds.length * 2;
    const mirror = nextSize + 1;
    seeds = seeds.flatMap((seed) => [seed, mirror - seed]);
  }

  return seeds;
};

const getEliminationRoundLabel = (totalRounds: number, roundNumber: number): string => {
  const matchesInRound = 2 ** (totalRounds - roundNumber);

  if (matchesInRound === 1) return "Final";
  if (matchesInRound === 2) return "Semifinal";
  if (matchesInRound === 4) return "Quarterfinal";

  return `Round ${roundNumber}`;
};

const clearDependentBranch = async (
  tournamentId: number,
  sourceMatchId: number,
  client: PoolClient
): Promise<void> => {
  const dependentMatch = await findDependentMatch(tournamentId, sourceMatchId, client);

  if (!dependentMatch) {
    return;
  }

  const side = dependentMatch.home_source_match_id === sourceMatchId ? "home" : "away";
  await setMatchParticipant(dependentMatch.matchid, side, null, client);
  await resetMatchOutcome(dependentMatch.matchid, client);
  await clearDependentBranch(tournamentId, dependentMatch.matchid, client);
};

const propagateWinnerToNextMatch = async (
  tournamentId: number,
  sourceMatchId: number,
  winnerTeamId: number,
  client: PoolClient
): Promise<void> => {
  const dependentMatch = await findDependentMatch(tournamentId, sourceMatchId, client);

  if (!dependentMatch) {
    return;
  }

  const side = dependentMatch.home_source_match_id === sourceMatchId ? "home" : "away";
  const existingTeamId = side === "home" ? dependentMatch.home_team_id : dependentMatch.away_team_id;

  if (existingTeamId === winnerTeamId) {
    return;
  }

  await setMatchParticipant(dependentMatch.matchid, side, winnerTeamId, client);
  await resetMatchOutcome(dependentMatch.matchid, client);
  await clearDependentBranch(tournamentId, dependentMatch.matchid, client);
};

const generateRoundRobinSchedule = async (
  tournamentId: number,
  startDate: string,
  teamIds: number[],
  venueIds: number[]
): Promise<{ generatedMatches: number }> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await clearTournamentMatchesWithExecutor(tournamentId, client);

    const rounds = generateRoundRobinPairings(teamIds);
    let generatedMatches = 0;

    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const roundPairings = rounds[roundIndex] ?? [];

      for (let pairingIndex = 0; pairingIndex < roundPairings.length; pairingIndex++) {
        const pairing = roundPairings[pairingIndex];
        const venueId = venueIds[pairingIndex % venueIds.length];

        if (!pairing || venueId === undefined) {
          continue;
        }

        const slotOffset = Math.floor(pairingIndex / venueIds.length);

        await insertTournamentMatch(
          {
            tournamentId,
            roundNumber: roundIndex + 1,
            slotNumber: pairingIndex + 1,
            matchLabel: `Round ${roundIndex + 1} Match ${pairingIndex + 1}`,
            homeTeamId: pairing.homeTeamId,
            awayTeamId: pairing.awayTeamId,
            homeSourceMatchId: null,
            awaySourceMatchId: null,
            winnerTeamId: null,
            venueId,
            matchTime: buildMatchTimestamp(startDate, roundIndex, slotOffset),
            homeScore: null,
            awayScore: null,
            status: "pending",
          },
          client
        );

        generatedMatches += 1;
      }
    }

    await client.query("COMMIT");
    return { generatedMatches };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const generateSingleEliminationBracket = async (
  tournamentId: number,
  startDate: string,
  teamIds: number[],
  venueIds: number[]
): Promise<{ generatedMatches: number }> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await clearTournamentMatchesWithExecutor(tournamentId, client);

    const bracketSize = nextPowerOfTwo(teamIds.length);
    const totalRounds = Math.log2(bracketSize);
    const seededOrder = buildSeedOrder(bracketSize);
    const seededTeams: TeamSlot[] = seededOrder.map((seed) => ({
      teamId: teamIds[seed - 1] ?? null,
    }));

    let previousRoundMatchIds: number[] = [];
    const autoWinners: Array<{ matchId: number; winnerTeamId: number }> = [];
    let generatedMatches = 0;

    for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
      const matchesInRound = 2 ** (totalRounds - roundNumber);
      const currentRoundMatchIds: number[] = [];
      const roundLabel = getEliminationRoundLabel(totalRounds, roundNumber);

      for (let slotIndex = 0; slotIndex < matchesInRound; slotIndex++) {
        const venueId = venueIds[slotIndex % venueIds.length];

        if (venueId === undefined) {
          throw new Error("Tournament requires at least 1 venue.");
        }

        const slotOffset = Math.floor(slotIndex / venueIds.length);
        let homeTeamId: number | null = null;
        let awayTeamId: number | null = null;
        let homeSourceMatchId: number | null = null;
        let awaySourceMatchId: number | null = null;
        let winnerTeamId: number | null = null;
        let status: "pending" | "completed" = "pending";

        if (roundNumber === 1) {
          homeTeamId = seededTeams[slotIndex * 2]?.teamId ?? null;
          awayTeamId = seededTeams[slotIndex * 2 + 1]?.teamId ?? null;

          if (homeTeamId !== null && awayTeamId === null) {
            winnerTeamId = homeTeamId;
            status = "completed";
          } else if (homeTeamId === null && awayTeamId !== null) {
            winnerTeamId = awayTeamId;
            status = "completed";
          }
        } else {
          homeSourceMatchId = previousRoundMatchIds[slotIndex * 2] ?? null;
          awaySourceMatchId = previousRoundMatchIds[slotIndex * 2 + 1] ?? null;
        }

        const matchId = await insertTournamentMatch(
          {
            tournamentId,
            roundNumber,
            slotNumber: slotIndex + 1,
            matchLabel: `${roundLabel} ${slotIndex + 1}`,
            homeTeamId,
            awayTeamId,
            homeSourceMatchId,
            awaySourceMatchId,
            winnerTeamId,
            venueId,
            matchTime: buildMatchTimestamp(startDate, roundNumber - 1, slotOffset),
            homeScore: null,
            awayScore: null,
            status,
          },
          client
        );

        if (winnerTeamId !== null) {
          autoWinners.push({ matchId, winnerTeamId });
        }

        currentRoundMatchIds.push(matchId);
        generatedMatches += 1;
      }

      previousRoundMatchIds = currentRoundMatchIds;
    }

    for (const autoWinner of autoWinners) {
      await propagateWinnerToNextMatch(
        tournamentId,
        autoWinner.matchId,
        autoWinner.winnerTeamId,
        client
      );
    }

    await client.query("COMMIT");
    return { generatedMatches };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const buildRoundName = (
  bracketType: string,
  roundNumber: number,
  totalRounds: number
): string => {
  if (bracketType === "single_elimination") {
    return getEliminationRoundLabel(totalRounds, roundNumber);
  }

  return `Round ${roundNumber}`;
};

export const getTournamentBracket = async (
  tournamentId: number,
  viewer: BracketViewer
) => {
  const context = await getTournamentScheduleContext(tournamentId);

  if (!context) {
    throw new Error("Tournament not found.");
  }

  const normalizedRole = viewer.role.trim().toLowerCase();
  const isOrganizerRole = normalizedRole === "organizer" || normalizedRole === "organize";

  if (isOrganizerRole && viewer.userId !== context.createdBy) {
    throw new Error("Access denied.");
  }

  const matches = await getBracketByTournament(tournamentId);
  const totalRounds = matches.reduce((max, match) => Math.max(max, match.round_number), 0);
  const roundsMap = new Map<number, BracketMatchRow[]>();

  for (const match of matches) {
    const roundMatches = roundsMap.get(match.round_number) ?? [];
    roundMatches.push(match);
    roundsMap.set(match.round_number, roundMatches);
  }

  const rounds = Array.from(roundsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([roundNumber, roundMatches]) => ({
      roundNumber,
      name: buildRoundName(context.bracketType, roundNumber, totalRounds),
      matches: roundMatches
        .sort((a, b) => a.slot_number - b.slot_number)
        .map((match) => ({
          matchId: match.matchid,
          label: match.match_label,
          slotNumber: match.slot_number,
          status: match.status,
          venue: match.venue,
          matchTime: match.match_time,
          winnerTeamId: match.winner_team_id,
          homeSourceMatchId: match.home_source_match_id,
          awaySourceMatchId: match.away_source_match_id,
          homeTeam: {
            id: match.home_team_id,
            name: match.home_team,
            score: match.home_score,
          },
          awayTeam: {
            id: match.away_team_id,
            name: match.away_team,
            score: match.away_score,
          },
        })),
    }));

  return {
    tournament: {
      tournamentId: context.tournamentId,
      name: context.name,
      sport: context.sport,
      bracketType: context.bracketType,
      startDate:
        normalizeDateString(context.startDate),
      endDate:
        normalizeDateString(context.endDate),
    },
    rounds,
  };
};

export const updateTournamentMatchResult = async (
  tournamentId: number,
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<{ winnerTeamId: number }> => {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    throw new Error("Scores must be whole numbers greater than or equal to 0.");
  }

  if (homeScore === awayScore) {
    throw new Error("Matches cannot end in a tie.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const match = await getMatchById(tournamentId, matchId, client);

    if (!match) {
      throw new Error("Match not found.");
    }

    if (match.home_team_id === null || match.away_team_id === null) {
      throw new Error("Both teams must be known before submitting a result.");
    }

    const winnerTeamId = homeScore > awayScore ? match.home_team_id : match.away_team_id;

    await saveMatchResult(tournamentId, matchId, homeScore, awayScore, winnerTeamId, client);

    if (match.bracket_type === "single_elimination") {
      await propagateWinnerToNextMatch(tournamentId, matchId, winnerTeamId, client);
    }

    await client.query("COMMIT");

    return { winnerTeamId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

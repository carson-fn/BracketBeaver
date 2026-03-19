import {
  createTournamentWithDetails,
  getScheduleByTournament,
  getTournamentScheduleContext,
  replaceTournamentSchedule,
  type CreateTournamentInput,
  type ScheduledMatchInsert,
} from "../models/tournamentModel.js";

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

  // Determine bracket type, if available, and reject unsupported types.
  const bracketType = (context as { bracketType?: string }).bracketType;
  if (bracketType && bracketType !== "round_robin") {
    throw new Error(
      `Schedule generation not supported for bracket type: ${bracketType}`
    );
  }

  let startDateStr = context.startDate;
  if (typeof startDateStr !== "string") {
    if (startDateStr instanceof Date) {
      startDateStr = startDateStr.toISOString().split("T")[0];
    } else {
      throw new Error("Invalid start date format.");
    }
  }

  const rounds = generateRoundRobinPairings(context.teams.map((team) => team.teamid));
  const matches: ScheduledMatchInsert[] = [];

  rounds.forEach((roundPairings, roundIndex) => {
    const roundStart = buildRoundStartTime(startDateStr, roundIndex);

    roundPairings.forEach((pairing, pairingIndex) => {
      const venue = context.venues[pairingIndex % context.venues.length];

      if (!venue) {
        throw new Error("Tournament requires at least 1 venue.");
      }

      const slotOffset = Math.floor(pairingIndex / context.venues.length);
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

      const isoString = matchTimestamp.toISOString();
      if (!isoString || isoString.includes("NaN")) {
        throw new Error(`Failed to build valid timestamp for match in round ${roundIndex + 1}`);
      }

      matches.push({
        tournamentId,
        roundNumber: roundIndex + 1,
        homeTeamId: pairing.homeTeamId,
        awayTeamId: pairing.awayTeamId,
        venueId: venue.venueid,
        matchTime: isoString,
      });
    });
  });

  await replaceTournamentSchedule(tournamentId, matches);

  return { generatedMatches: matches.length };
};

export const getTournamentSchedule = async (tournamentId: number) => {
  return getScheduleByTournament(tournamentId);
};

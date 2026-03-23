import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../database/database.js";

type DbExecutor = PoolClient | typeof pool;

export type CreateTournamentInput = {
  name: string;
  sport: string;
  bracketType: string;
  startDate: string;
  endDate: string;
  createdBy: number;
  teams: string[];
  venues: string[];
};

export type TeamRow = {
  teamid: number;
  name: string;
};

export type VenueRow = {
  venueid: number;
  name: string;
};

export type TournamentScheduleContext = {
  tournamentId: number;
  name: string;
  sport: string;
  startDate: string | Date;
  endDate: string | Date;
  bracketType: string;
  createdBy: number;
  teams: TeamRow[];
  venues: VenueRow[];
};

export type ScheduledMatchInsert = {
  tournamentId: number;
  roundNumber: number;
  slotNumber: number;
  matchLabel: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeSourceMatchId: number | null;
  awaySourceMatchId: number | null;
  winnerTeamId: number | null;
  venueId: number;
  matchTime: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "pending" | "completed";
};

export type BracketMatchRow = {
  matchid: number;
  tournamentid: number;
  round_number: number;
  slot_number: number;
  match_label: string;
  status: "pending" | "completed";
  home_team_id: number | null;
  away_team_id: number | null;
  winner_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  home_source_match_id: number | null;
  away_source_match_id: number | null;
  home_team: string;
  away_team: string;
  winner_team: string | null;
  venue: string;
  match_time: string;
};

export type MatchRecord = {
  matchid: number;
  tournamentid: number;
  bracket_type: string;
  round_number: number;
  slot_number: number;
  home_team_id: number | null;
  away_team_id: number | null;
  winner_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  home_source_match_id: number | null;
  away_source_match_id: number | null;
  status: "pending" | "completed";
};

const query = async <T extends QueryResultRow>(
  executor: DbExecutor,
  sql: string,
  params: unknown[] = []
) => executor.query<T>(sql, params);

export const createTournamentWithDetails = async (
  input: CreateTournamentInput
): Promise<number> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tournamentResult = await client.query<{ tournamentid: number }>(
      `INSERT INTO tournaments (name, sport, bracket_type, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING tournamentID`,
      [
        input.name,
        input.sport,
        input.bracketType,
        input.startDate,
        input.endDate,
        input.createdBy,
      ]
    );

    const tournamentRow = tournamentResult.rows[0];

    if (!tournamentRow) {
      throw new Error("Failed to create tournament.");
    }

    const tournamentId = tournamentRow.tournamentid;

    for (const teamName of input.teams) {
      await client.query(
        `INSERT INTO teams (tournamentID, name)
         VALUES ($1, $2)`,
        [tournamentId, teamName]
      );
    }

    for (const venueName of input.venues) {
      await client.query(
        `INSERT INTO venues (tournamentID, name)
         VALUES ($1, $2)`,
        [tournamentId, venueName]
      );
    }

    await client.query("COMMIT");
    return tournamentId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getTournamentScheduleContext = async (
  tournamentId: number
): Promise<TournamentScheduleContext | null> => {
  const tournamentResult = await pool.query<{
    tournamentid: number;
    name: string;
    sport: string;
    start_date: string | Date;
    end_date: string | Date;
    bracket_type: string;
    created_by: number;
  }>(
    `SELECT tournamentID, name, sport, start_date, end_date, bracket_type, created_by
     FROM tournaments
     WHERE tournamentID = $1`,
    [tournamentId]
  );

  if (tournamentResult.rowCount === 0) {
    return null;
  }

  const tournamentRow = tournamentResult.rows[0];

  if (!tournamentRow) {
    return null;
  }

  const teamsResult = await pool.query<TeamRow>(
    `SELECT teamID, name
     FROM teams
     WHERE tournamentID = $1
     ORDER BY teamID ASC`,
    [tournamentId]
  );

  const venuesResult = await pool.query<VenueRow>(
    `SELECT venueID, name
     FROM venues
     WHERE tournamentID = $1
     ORDER BY venueID ASC`,
    [tournamentId]
  );

  return {
    tournamentId,
    name: tournamentRow.name,
    sport: tournamentRow.sport,
    startDate: tournamentRow.start_date,
    endDate: tournamentRow.end_date,
    bracketType: tournamentRow.bracket_type,
    createdBy: tournamentRow.created_by,
    teams: teamsResult.rows,
    venues: venuesResult.rows,
  };
};

export const clearTournamentMatchesWithExecutor = async (
  tournamentId: number,
  executor: DbExecutor
): Promise<void> => {
  await query(
    executor,
    `DELETE FROM matches
     WHERE tournamentID = $1`,
    [tournamentId]
  );
};

export const insertTournamentMatch = async (
  match: ScheduledMatchInsert,
  executor: DbExecutor
): Promise<number> => {
  const result = await query<{ matchid: number }>(
    executor,
    `INSERT INTO matches (
      tournamentID,
      round_number,
      slot_number,
      match_label,
      home_team_id,
      away_team_id,
      home_source_match_id,
      away_source_match_id,
      winner_team_id,
      venue_id,
      match_time,
      home_score,
      away_score,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING matchID`,
    [
      match.tournamentId,
      match.roundNumber,
      match.slotNumber,
      match.matchLabel,
      match.homeTeamId,
      match.awayTeamId,
      match.homeSourceMatchId,
      match.awaySourceMatchId,
      match.winnerTeamId,
      match.venueId,
      match.matchTime,
      match.homeScore,
      match.awayScore,
      match.status,
    ]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Failed to insert match.");
  }

  return row.matchid;
};

export const getBracketByTournament = async (
  tournamentId: number
): Promise<BracketMatchRow[]> => {
  const result = await pool.query<BracketMatchRow>(
    `SELECT
      m.matchID,
      m.tournamentID,
      m.round_number,
      m.slot_number,
      m.match_label,
      m.status,
      m.home_team_id,
      m.away_team_id,
      m.winner_team_id,
      m.home_score,
      m.away_score,
      m.home_source_match_id,
      m.away_source_match_id,
      COALESCE(th.name, 'TBD') AS home_team,
      COALESCE(ta.name, 'TBD') AS away_team,
      tw.name AS winner_team,
      v.name AS venue,
      m.match_time::text AS match_time
     FROM matches m
     LEFT JOIN teams th ON m.home_team_id = th.teamID
     LEFT JOIN teams ta ON m.away_team_id = ta.teamID
     LEFT JOIN teams tw ON m.winner_team_id = tw.teamID
     JOIN venues v ON m.venue_id = v.venueID
     WHERE m.tournamentID = $1
     ORDER BY m.round_number ASC, m.slot_number ASC, m.matchID ASC`,
    [tournamentId]
  );

  return result.rows;
};

export const getMatchById = async (
  tournamentId: number,
  matchId: number,
  executor: DbExecutor = pool
): Promise<MatchRecord | null> => {
  const result = await query<MatchRecord>(
    executor,
    `SELECT
      m.matchID,
      m.tournamentID,
      t.bracket_type,
      m.round_number,
      m.slot_number,
      m.home_team_id,
      m.away_team_id,
      m.winner_team_id,
      m.home_score,
      m.away_score,
      m.home_source_match_id,
      m.away_source_match_id,
      m.status
     FROM matches m
     JOIN tournaments t ON m.tournamentID = t.tournamentID
     WHERE m.tournamentID = $1 AND m.matchID = $2`,
    [tournamentId, matchId]
  );

  return result.rows[0] ?? null;
};

export const saveMatchResult = async (
  tournamentId: number,
  matchId: number,
  homeScore: number,
  awayScore: number,
  winnerTeamId: number,
  executor: DbExecutor
): Promise<void> => {
  await query(
    executor,
    `UPDATE matches
     SET home_score = $1,
         away_score = $2,
         winner_team_id = $3,
         status = 'completed'
     WHERE tournamentID = $4 AND matchID = $5`,
    [homeScore, awayScore, winnerTeamId, tournamentId, matchId]
  );
};

export const findDependentMatch = async (
  tournamentId: number,
  sourceMatchId: number,
  executor: DbExecutor
): Promise<MatchRecord | null> => {
  const result = await query<MatchRecord>(
    executor,
    `SELECT
      m.matchID,
      m.tournamentID,
      t.bracket_type,
      m.round_number,
      m.slot_number,
      m.home_team_id,
      m.away_team_id,
      m.winner_team_id,
      m.home_score,
      m.away_score,
      m.home_source_match_id,
      m.away_source_match_id,
      m.status
     FROM matches m
     JOIN tournaments t ON m.tournamentID = t.tournamentID
     WHERE m.tournamentID = $1
       AND (m.home_source_match_id = $2 OR m.away_source_match_id = $2)
     ORDER BY m.round_number ASC
     LIMIT 1`,
    [tournamentId, sourceMatchId]
  );

  return result.rows[0] ?? null;
};

export const setMatchParticipant = async (
  matchId: number,
  side: "home" | "away",
  teamId: number | null,
  executor: DbExecutor
): Promise<void> => {
  const column = side === "home" ? "home_team_id" : "away_team_id";

  await query(
    executor,
    `UPDATE matches
     SET ${column} = $1
     WHERE matchID = $2`,
    [teamId, matchId]
  );
};

export const resetMatchOutcome = async (
  matchId: number,
  executor: DbExecutor
): Promise<void> => {
  await query(
    executor,
    `UPDATE matches
     SET home_score = NULL,
         away_score = NULL,
         winner_team_id = NULL,
         status = 'pending'
     WHERE matchID = $1`,
    [matchId]
  );
};

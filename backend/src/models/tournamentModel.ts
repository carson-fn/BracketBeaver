import { pool } from "../database/database.js";

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
  startDate: string;
  endDate: string;
  bracketType: string;
  teams: TeamRow[];
  venues: VenueRow[];
};

export type ScheduledMatchInsert = {
  tournamentId: number;
  roundNumber: number;
  homeTeamId: number;
  awayTeamId: number;
  venueId: number;
  matchTime: string;
};

export type ScheduleRow = {
  matchid: number;
  round_number: number;
  home_team: string;
  away_team: string;
  venue: string;
  match_time: string;
};

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
    start_date: string;
    end_date: string;
    bracket_type: string;
  }>(
    `SELECT tournamentID, start_date, end_date, bracket_type
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
    startDate: tournamentRow.start_date,
    endDate: tournamentRow.end_date,
    bracketType: tournamentRow.bracket_type,
    teams: teamsResult.rows,
    venues: venuesResult.rows,
  };
};

export const replaceTournamentSchedule = async (
  tournamentId: number,
  matches: ScheduledMatchInsert[]
): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM matches
       WHERE tournamentID = $1`,
      [tournamentId]
    );

    for (const match of matches) {
      await client.query(
        `INSERT INTO matches (tournamentID, round_number, home_team_id, away_team_id, venue_id, match_time)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          match.tournamentId,
          match.roundNumber,
          match.homeTeamId,
          match.awayTeamId,
          match.venueId,
          match.matchTime,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getScheduleByTournament = async (
  tournamentId: number
): Promise<ScheduleRow[]> => {
  const result = await pool.query<ScheduleRow>(
    `SELECT
      m.matchID,
      m.round_number,
      th.name AS home_team,
      ta.name AS away_team,
      v.name AS venue,
      m.match_time::text AS match_time
     FROM matches m
     JOIN teams th ON m.home_team_id = th.teamID
     JOIN teams ta ON m.away_team_id = ta.teamID
     JOIN venues v ON m.venue_id = v.venueID
     WHERE m.tournamentID = $1
     ORDER BY m.round_number ASC, m.match_time ASC, m.matchID ASC`,
    [tournamentId]
  );

  return result.rows;
};

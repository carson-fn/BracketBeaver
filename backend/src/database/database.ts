import { Pool } from "pg";

// Load environment variables from .env file only in development mode
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}


// DB connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let schemaReadyPromise: Promise<void> | null = null;

export const ensureDatabaseSchema = async (): Promise<void> => {
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    // Migrate password column size from 30 to 60 characters
    await pool.query(
      `ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(60)`
    ).catch(() => {
      // Column might already be the correct size, ignore error
    });

    await pool.query(
      `ALTER TABLE matches ALTER COLUMN home_team_id DROP NOT NULL`
    );
    await pool.query(
      `ALTER TABLE matches ALTER COLUMN away_team_id DROP NOT NULL`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS slot_number INTEGER`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_label VARCHAR(100)`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_source_match_id INTEGER REFERENCES matches(matchID) ON DELETE SET NULL`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_source_match_id INTEGER REFERENCES matches(matchID) ON DELETE SET NULL`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_team_id INTEGER REFERENCES teams(teamID) ON DELETE SET NULL`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_score INTEGER`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_score INTEGER`
    );
    await pool.query(
      `ALTER TABLE matches ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'`
    );
    await pool.query(
      `WITH ranked AS (
         SELECT
           matchID,
           ROW_NUMBER() OVER (
             PARTITION BY tournamentID, round_number
             ORDER BY match_time ASC, matchID ASC
           ) AS computed_slot
         FROM matches
       )
       UPDATE matches m
       SET slot_number = ranked.computed_slot,
           match_label = COALESCE(m.match_label, CONCAT('Round ', m.round_number, ' Match ', ranked.computed_slot)),
           status = COALESCE(m.status, 'pending')
       FROM ranked
       WHERE m.matchID = ranked.matchID`
    );
    await pool.query(
      `ALTER TABLE matches ALTER COLUMN slot_number SET NOT NULL`
    );
    await pool.query(
      `ALTER TABLE matches ALTER COLUMN match_label SET NOT NULL`
    );
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS matches_tournament_round_slot_idx
       ON matches (tournamentID, round_number, slot_number)`
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS matches_home_source_idx
       ON matches (home_source_match_id)`
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS matches_away_source_idx
       ON matches (away_source_match_id)`
    );
  })();

  return schemaReadyPromise;
};

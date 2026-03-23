DROP DATABASE IF EXISTS bracket_beaver;

CREATE DATABASE bracket_beaver;

\c bracket_beaver

CREATE TABLE users (
    userID SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    role VARCHAR(20) NOT NULL
);

INSERT INTO users (username, password, role) VALUES
('alice', '$2a$10$5X1e7OOhqfXzc0O8t.eqLOd4Ov/TmXN9H1dKGXqh2QLN1Y8Z8z6qa', 'organizer'),
('admin', '$2a$10$1R3Aj3LQ8Y7VYu8/5xGbL.5oX1YnbXlZ5Y5/5pD5V8F0K3K1K2K3K', 'admin');

CREATE TABLE tournaments (
    tournamentID SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    bracket_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(userID) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    teamID SERIAL PRIMARY KEY,
    tournamentID INTEGER NOT NULL REFERENCES tournaments(tournamentID) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournamentID, name)
);

CREATE TABLE venues (
    venueID SERIAL PRIMARY KEY,
    tournamentID INTEGER NOT NULL REFERENCES tournaments(tournamentID) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournamentID, name)
);

CREATE TABLE matches (
    matchID SERIAL PRIMARY KEY,
    tournamentID INTEGER NOT NULL REFERENCES tournaments(tournamentID) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    slot_number INTEGER NOT NULL,
    match_label VARCHAR(100) NOT NULL,
    home_team_id INTEGER REFERENCES teams(teamID) ON DELETE RESTRICT,
    away_team_id INTEGER REFERENCES teams(teamID) ON DELETE RESTRICT,
    home_source_match_id INTEGER REFERENCES matches(matchID) ON DELETE SET NULL,
    away_source_match_id INTEGER REFERENCES matches(matchID) ON DELETE SET NULL,
    winner_team_id INTEGER REFERENCES teams(teamID) ON DELETE SET NULL,
    venue_id INTEGER NOT NULL REFERENCES venues(venueID) ON DELETE RESTRICT,
    match_time TIMESTAMPTZ NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (home_team_id IS NULL OR away_team_id IS NULL OR home_team_id <> away_team_id),
    CHECK (status IN ('pending', 'completed')),
    UNIQUE (tournamentID, round_number, slot_number),
    UNIQUE (tournamentID, venue_id, match_time)
);

CREATE INDEX matches_home_source_idx ON matches (home_source_match_id);
CREATE INDEX matches_away_source_idx ON matches (away_source_match_id);


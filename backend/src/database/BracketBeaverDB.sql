DROP DATABASE IF EXISTS bracket_beaver;

CREATE DATABASE bracket_beaver;

\c bracket_beaver

CREATE TABLE users (
    userID SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(30) NOT NULL,
    role VARCHAR(20) NOT NULL
);

INSERT INTO users (username, password, role) VALUES
('alice', 'alice123', 'organizer'),
('admin', 'admin123', 'admin');

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
    home_team_id INTEGER NOT NULL REFERENCES teams(teamID) ON DELETE RESTRICT,
    away_team_id INTEGER NOT NULL REFERENCES teams(teamID) ON DELETE RESTRICT,
    venue_id INTEGER NOT NULL REFERENCES venues(venueID) ON DELETE RESTRICT,
    match_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (home_team_id <> away_team_id),
    UNIQUE (tournamentID, round_number, home_team_id, away_team_id),
    UNIQUE (tournamentID, venue_id, match_time),
    UNIQUE (tournamentID, home_team_id, match_time),
    UNIQUE (tournamentID, away_team_id, match_time)
);


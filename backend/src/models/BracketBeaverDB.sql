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


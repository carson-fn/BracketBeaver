-- This script updates existing user passwords to use bcrypt hashes
-- Run this if you already have a bracket_beaver database with plaintext passwords

-- Update alice user with bcrypt hash of 'alice123'
UPDATE users SET password = '$2a$10$5X1e7OOhqfXzc0O8t.eqLOd4Ov/TmXN9H1dKGXqh2QLN1Y8Z8z6qa' WHERE username = 'alice';

-- Update admin user with bcrypt hash of 'admin123'
UPDATE users SET password = '$2a$10$1R3Aj3LQ8Y7VYu8/5xGbL.5oX1YnbXlZ5Y5/5pD5V8F0K3K1K2K3K' WHERE username = 'admin';

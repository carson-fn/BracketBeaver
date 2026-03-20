import {pool} from ".././database/database.js";

export const findUserByUsername = async (username: string) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE username = $1",
    [username]
  );

  return result.rows[0];
};

export const createUser = async (username: string, password: string) => {
  await pool.query(
    "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
    [username, password, "organizer"]
  );
};
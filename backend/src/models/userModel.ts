import {pool} from ".././database/database.js";

export const findUserByUsername = async (username: string) => {
  const result = await pool.query(
    "SELECT userID as id, username, password, role FROM users WHERE username = $1",
    [username]
  );

  return result.rows[0];
};

export const findUserById = async (userId: number) => {
  const result = await pool.query(
    "SELECT userID as id, username, role FROM users WHERE userID = $1",
    [userId]
  );

  return result.rows[0];
};

export const createUser = async (username: string, hashedPassword: string) => {
  await pool.query(
    "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
    [username, hashedPassword, "organizer"]
  );
};

export const updateUser = async (userId: number, username: string, hashedPassword: string) => {
  const result = await pool.query(
    "UPDATE users SET username = $1, password = $2 WHERE userID = $3 RETURNING userID as id, username, role",
    [username, hashedPassword, userId]
  );

  return result.rows[0];
};

export const getAllUsers = async () => {
  const result = await pool.query(
    "SELECT userID as id, username, role FROM users ORDER BY userID"
  );

  return result.rows;
};

export const deleteUser = async (userId: number) => {
  const result = await pool.query(
    "DELETE FROM users WHERE userID = $1 RETURNING userID as id",
    [userId]
  );

  return result.rows[0];
};
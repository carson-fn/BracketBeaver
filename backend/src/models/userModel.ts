import { pool } from ".././database/database.js";
import bcrypt from "bcryptjs";

export const findUserByUsername = async (username: string) => {
  const result = await pool.query(
    "SELECT userID, username, password, role FROM users WHERE username = $1",
    [username]
  );

  return result.rows[0];
};

export const createUser = async (username: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await pool.query(
    "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
    [username, hashedPassword, "organizer"]
  );
};
import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "BracketBeaverDB",
  password: "password",
  port: 5432,
});
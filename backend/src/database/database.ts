import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bracket_beaver",
  password: "password",
  port: 5432,
});
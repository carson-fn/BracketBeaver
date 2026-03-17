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
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:randhawa321@localhost:5432/bracket_beaver",
});

async function checkDatabase() {
  try {
    console.log("Checking users table...");
    const users = await pool.query("SELECT * FROM users");
    console.log("Users found:", users.rows);

    console.log("\nChecking tournaments table...");
    const tournaments = await pool.query("SELECT * FROM tournaments LIMIT 5");
    console.log("Tournaments found:", tournaments.rows);

    console.log("\nUser count:", users.rows.length);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();

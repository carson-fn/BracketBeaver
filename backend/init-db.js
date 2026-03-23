const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:randhawa321@localhost:5432/postgres",
  // Connect to default postgres DB first
});

async function initializeDatabase() {
  try {
    console.log("Reading SQL initialization file...");
    const sqlPath = path.join(__dirname, "src/database/BracketBeaverDB.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing SQL...");
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("\\"));

    for (const statement of statements) {
      console.log("Executing:", statement.substring(0, 50) + "...");
      await pool.query(statement);
    }

    console.log("\n✅ Database initialized successfully!");

    console.log("\nVerifying users...");
    const userPool = new Pool({
      connectionString:
        "postgresql://postgres:randhawa321@localhost:5432/bracket_beaver",
    });
    const users = await userPool.query("SELECT userID, username, role FROM users");
    console.log("Users in database:");
    console.table(users.rows);
    await userPool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

initializeDatabase();

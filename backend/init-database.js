#!/usr/bin/env node
/**
 * Initialize Database Script
 * 
 * This script initializes the Bracket Beaver database with test users.
 * 
 * Usage: node init-database.js
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:randhawa321@localhost:5432/bracket_beaver",
});

async function main() {
  try {
    console.log("\n=== Bracket Beaver Database Initialization ===\n");

    // Check if tables exist
    console.log("1️⃣  Checking if tables exist...");
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("❌ Tables don't exist. Running database initialization SQL...\n");

      const sqlPath = path.join(__dirname, "src/database/BracketBeaverDB.sql");
      let sqlContent = fs.readFileSync(sqlPath, "utf8");

      // Remove psql-specific commands
      sqlContent = sqlContent
        .replace(/^\\c bracket_beaver$/gm, "")
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0)
        .join(";\n");

      // Execute each statement
      const statements = sqlContent.split(";").filter((s) => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          await pool.query(stmt + ";");
        }
      }

      console.log("✅ Database schema created!\n");
    } else {
      console.log("✅ Tables already exist\n");
    }

    // Check users
    console.log("2️⃣  Checking users in database...");
    const userCheck = await pool.query("SELECT COUNT(*) as count FROM users");
    const userCount = parseInt(userCheck.rows[0].count, 10);

    if (userCount === 0) {
      console.log("⚠️  No users found. Inserting test users...\n");

      await pool.query(`
        INSERT INTO users (username, password, role) VALUES
        ('alice', 'alice123', 'organizer'),
        ('admin', 'admin123', 'admin')
      `);

      console.log("✅ Test users inserted!\n");
    } else {
      console.log(`✅ Found ${userCount} users\n`);
    }

    // Display users
    console.log("3️⃣  Current users in database:");
    console.log("-----------------------------------");
    const users = await pool.query("SELECT userID, username, role FROM users ORDER BY userID");
    console.table(users.rows);

    console.log(
      "\n✅ Database initialization complete!\n" +
      "You can now login with:\n" +
      "  - Username: alice, Password: alice123 (Organizer)\n" +
      "  - Username: admin, Password: admin123 (Admin)\n"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error(
        "\n💡 Cannot connect to PostgreSQL. Make sure:\n" +
        "  1. PostgreSQL is running\n" +
        "  2. Connection string in .env is correct\n" +
        "  3. Database 'bracket_beaver' exists (or comment out the check)\n"
      );
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

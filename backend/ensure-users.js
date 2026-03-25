const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:randhawa321@localhost:5432/bracket_beaver",
});

async function ensureUsersExist() {
  try {
    console.log("Checking if users exist...");
    const result = await pool.query("SELECT COUNT(*) as count FROM users");
    const userCount = parseInt(result.rows[0].count, 10);

    if (userCount === 0) {
      console.log("❌ No users found. Inserting test users...");
      
      await pool.query(
        `INSERT INTO users (username, password, role) VALUES
         ('alice', 'alice123', 'organizer'),
         ('admin', 'admin123', 'admin')`
      );
      
      console.log("✅ Test users inserted successfully!");
    } else {
      console.log(`✅ Found ${userCount} users in database`);
    }

    console.log("\nVerifying users...");
    const users = await pool.query("SELECT userID, username, role FROM users");
    console.table(users.rows);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

ensureUsersExist();

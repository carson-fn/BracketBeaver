#!/usr/bin/env node
import bcrypt from "bcryptjs";

async function main() {
  console.log("🔐 Generating bcrypt hashes for test users...\n");
  
  const alice = await bcrypt.hash("alice123", 10);
  const admin = await bcrypt.hash("admin123", 10);
  
  console.log("Run these SQL commands in your PostgreSQL database:\n");
  console.log("-- Delete old test users");
  console.log("DELETE FROM users WHERE username IN ('alice', 'admin');\n");
  console.log("-- Insert new test users with valid bcrypt hashes");
  console.log(`INSERT INTO users (username, password, role) VALUES`);
  console.log(`('alice', '${alice}', 'organizer'),`);
  console.log(`('admin', '${admin}', 'admin');\n`);
  
  console.log("\n✅ After running these commands:");
  console.log("   - Restart your backend server");
  console.log("   - Try logging in with alice/alice123");
  console.log("   - Newly created users from signup will also work!");
}

main().catch(console.error);

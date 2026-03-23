import bcrypt from "bcryptjs";

async function testHash() {
  // The hash that's currently in your database
  const storedHash = "$2a$10$5X1e7OOhqfXzc0O8t.eqLOd4Ov/TmXN9H1dKGXqh2QLN1Y8Z8z6qa";
  
  // Test if it matches alice123
  const isValid = await bcrypt.compare("alice123", storedHash);
  console.log("Does hash match 'alice123'?", isValid);
  
  // Generate fresh hashes
  const freshAliceHash = await bcrypt.hash("alice123", 10);
  const freshAdminHash = await bcrypt.hash("admin123", 10);
  
  console.log("\nFresh hashes (use these in database):");
  console.log("Alice:", freshAliceHash);
  console.log("Admin:", freshAdminHash);
}

testHash().catch(console.error);

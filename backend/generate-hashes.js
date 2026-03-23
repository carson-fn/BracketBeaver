import bcrypt from "bcryptjs";

async function generateHashes() {
  const aliceHash = await bcrypt.hash("alice123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);
  
  console.log("alice hash:", aliceHash);
  console.log("admin hash:", adminHash);
  console.log("\nRun these SQL commands:");
  console.log(`UPDATE users SET password = '${aliceHash}' WHERE username = 'alice';`);
  console.log(`UPDATE users SET password = '${adminHash}' WHERE username = 'admin';`);
}

generateHashes();

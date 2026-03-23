const bcryptjs = require('bcryptjs');

async function hash() {
  const alice = await bcryptjs.hash('alice123', 10);
  const admin = await bcryptjs.hash('admin123', 10);
  console.log('alice:', alice);
  console.log('admin:', admin);
}

hash();

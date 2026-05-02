// Generate a bcrypt hash for ADMIN_PASSWORD_HASH.
// Usage: pnpm --filter @fuse/web exec tsx scripts/hash-password.ts <password>

import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log(hash);

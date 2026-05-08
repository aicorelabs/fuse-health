// Generate a bcrypt hash for ADMIN_PASSWORD_HASH.
// Usage: pnpm hash-password <password>
//
// Output is pre-escaped for Next.js's dotenv-expand: each `$` becomes `\$`,
// so you can paste the line directly into .env. After expansion at runtime
// the value is the original 60-char bcrypt hash.

import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const escaped = hash.replace(/\$/g, "\\$");
console.log(`ADMIN_PASSWORD_HASH="${escaped}"`);

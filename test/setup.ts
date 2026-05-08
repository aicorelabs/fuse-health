import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
loadEnv({ path: resolve(repoRoot, ".env") });

if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = "test-groq-key";
}

if (!process.env.FUSE_SECRET_KEY) {
  process.env.FUSE_SECRET_KEY = "test-fuse-secret-not-for-real-use";
}


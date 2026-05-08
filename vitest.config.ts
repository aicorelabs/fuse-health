import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
loadEnv({ path: resolve(repoRoot, ".env") });

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [resolve(repoRoot, "test/setup.ts")],
    include: [
      "packages/*/src/**/*.test.ts",
      "apps/web/src/**/*.test.{ts,tsx}",
    ],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});

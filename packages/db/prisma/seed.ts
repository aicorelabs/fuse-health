import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const here = fileURLToPath(new URL(".", import.meta.url));
loadEnv({ path: resolve(here, "../../../.env") });

import { PrismaClient } from "@prisma/client";

import { demoWorkflow } from "../src/seed-data.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.workflow.upsert({
    where: { id: demoWorkflow.id },
    update: {
      name: demoWorkflow.name,
      description: demoWorkflow.description,
      graph: demoWorkflow.graph as never,
      maxConcurrent: demoWorkflow.maxConcurrent,
    },
    create: {
      id: demoWorkflow.id,
      name: demoWorkflow.name,
      description: demoWorkflow.description,
      graph: demoWorkflow.graph as never,
      maxConcurrent: demoWorkflow.maxConcurrent,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded workflow: ${demoWorkflow.id}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

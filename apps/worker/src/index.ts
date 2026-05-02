import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const logger = pino({ name: "fuse-worker" });

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  logger.error("REDIS_URL is not set");
  process.exit(1);
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

export const workflowQueue = new Queue("workflow-runs", { connection });

const worker = new Worker(
  "workflow-runs",
  async (job) => {
    logger.info({ jobId: job.id, name: job.name }, "processing workflow run");
    // TODO: hand off to engine in @fuse/core once implemented
    return { ok: true };
  },
  { connection },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "completed");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "failed");
});

logger.info("worker online");

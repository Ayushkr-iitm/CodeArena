import { Queue, Worker, Job } from "bullmq";
import { redisConfig } from "./redis";
import { IQueue, QueueMetrics, SubmissionJobData, SubmissionJobResult } from "./types";
import { processSubmissionJob } from "./submission.worker";

const QUEUE_NAME = "judge-submissions";
const WORKER_CONCURRENCY = parseInt(process.env.JUDGE_CONCURRENCY || "4", 10);

export class BullMQQueue implements IQueue {
  readonly mode = "redis_bullmq" as const;
  private queue: Queue<SubmissionJobData, SubmissionJobResult>;
  private worker: Worker<SubmissionJobData, SubmissionJobResult>;

  constructor() {
    this.queue = new Queue(QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200,     // Keep last 200 failed jobs
      },
    });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job: Job<SubmissionJobData>) => {
        return processSubmissionJob(job.data);
      },
      {
        connection: redisConfig,
        concurrency: WORKER_CONCURRENCY,
      }
    );

    this.worker.on("completed", (job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
    });

    console.log(`🚀 BullMQ Redis Queue initialized with ${WORKER_CONCURRENCY} concurrent workers`);
  }

  async addSubmissionJob(data: SubmissionJobData): Promise<string> {
    const job = await this.queue.add("evaluate", data, {
      jobId: data.submissionId,
    });
    return job.id || data.submissionId;
  }

  async getMetrics(): Promise<QueueMetrics> {
    const counts = await this.queue.getJobCounts("waiting", "active", "completed", "failed");
    return {
      mode: this.mode,
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      concurrency: WORKER_CONCURRENCY,
    };
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}

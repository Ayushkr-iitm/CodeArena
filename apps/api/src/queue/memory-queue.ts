import { EventEmitter } from "events";
import { IQueue, QueueMetrics, SubmissionJobData, SubmissionJobResult } from "./types";
import { processSubmissionJob } from "./submission.worker";

const WORKER_CONCURRENCY = parseInt(process.env.JUDGE_CONCURRENCY || "4", 10);

interface QueuedItem {
  data: SubmissionJobData;
  resolve: (id: string) => void;
  reject: (err: any) => void;
}

export class InMemoryQueue extends EventEmitter implements IQueue {
  readonly mode = "in_memory" as const;
  private waitingQueue: QueuedItem[] = [];
  private activeCount: number = 0;
  private completedCount: number = 0;
  private failedCount: number = 0;
  private isClosed: boolean = false;

  constructor() {
    super();
    console.log(`⚡ In-Memory Asynchronous Job Queue initialized with ${WORKER_CONCURRENCY} worker slots`);
  }

  async addSubmissionJob(data: SubmissionJobData): Promise<string> {
    if (this.isClosed) {
      throw new Error("Job queue is closed");
    }

    return new Promise<string>((resolve, reject) => {
      this.waitingQueue.push({ data, resolve, reject });
      // Enqueued immediately, trigger worker pool
      resolve(data.submissionId);
      this.drain();
    });
  }

  private drain() {
    while (this.activeCount < WORKER_CONCURRENCY && this.waitingQueue.length > 0) {
      const item = this.waitingQueue.shift();
      if (!item) break;

      this.activeCount++;
      this.runJob(item.data);
    }
  }

  private async runJob(data: SubmissionJobData) {
    try {
      const result = await processSubmissionJob(data);
      this.completedCount++;
      this.emit("completed", { jobId: data.submissionId, result });
    } catch (err: any) {
      this.failedCount++;
      this.emit("failed", { jobId: data.submissionId, error: err.message });
      console.error(`[Memory Worker] Job ${data.submissionId} failed:`, err.message);
    } finally {
      this.activeCount--;
      this.drain(); // Process next job in queue
    }
  }

  async getMetrics(): Promise<QueueMetrics> {
    return {
      mode: this.mode,
      waiting: this.waitingQueue.length,
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      concurrency: WORKER_CONCURRENCY,
    };
  }

  async close(): Promise<void> {
    this.isClosed = true;
    this.waitingQueue = [];
  }
}

import { IQueue, QueueMetrics, SubmissionJobData } from "./types";
import { isRedisAvailable } from "./redis";
import { BullMQQueue } from "./bullmq-queue";
import { InMemoryQueue } from "./memory-queue";

let activeQueue: IQueue | null = null;

export async function initQueue(): Promise<IQueue> {
  if (activeQueue) return activeQueue;

  const redisUp = await isRedisAvailable();
  if (redisUp) {
    try {
      activeQueue = new BullMQQueue();
      return activeQueue;
    } catch (err: any) {
      console.warn("⚠️ Failed to initialize BullMQ. Falling back to In-Memory Queue:", err.message);
    }
  } else {
    console.log("ℹ️ Redis server not detected. Using zero-config In-Memory Worker Queue with 4 concurrent workers.");
  }

  activeQueue = new InMemoryQueue();
  return activeQueue;
}

export async function getQueue(): Promise<IQueue> {
  if (!activeQueue) {
    return initQueue();
  }
  return activeQueue;
}

export async function enqueueSubmission(data: SubmissionJobData): Promise<string> {
  const queue = await getQueue();
  return queue.addSubmissionJob(data);
}

export async function getQueueMetrics(): Promise<QueueMetrics> {
  const queue = await getQueue();
  return queue.getMetrics();
}

import { JudgeLanguage, SubmissionEvaluationResult } from "../judge/types";

export interface SubmissionJobData {
  submissionId: string;
  problemId: string;
  userId: string;
  language: JudgeLanguage;
  code: string;
}

export interface SubmissionJobResult {
  submissionId: string;
  evaluation: SubmissionEvaluationResult;
  ratingBonus: number;
}

export type JobState = "WAITING" | "ACTIVE" | "COMPLETED" | "FAILED";

export interface QueueMetrics {
  mode: "redis_bullmq" | "in_memory";
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  concurrency: number;
}

export interface IQueue {
  readonly mode: "redis_bullmq" | "in_memory";
  addSubmissionJob(data: SubmissionJobData): Promise<string>;
  getMetrics(): Promise<QueueMetrics>;
  close(): Promise<void>;
}

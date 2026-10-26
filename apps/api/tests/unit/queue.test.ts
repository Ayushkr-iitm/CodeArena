import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryQueue } from "../../src/queue/memory-queue";

describe("Asynchronous Worker Pool & In-Memory Queue — Unit Tests", () => {
  it("should initialize with in_memory mode and 0 active/waiting jobs", async () => {
    const queue = new InMemoryQueue();
    const metrics = await queue.getMetrics();

    assert.equal(metrics.mode, "in_memory");
    assert.equal(metrics.waiting, 0);
    assert.equal(metrics.active, 0);
    assert.equal(metrics.completed, 0);
    assert.equal(metrics.failed, 0);
    assert.ok(metrics.concurrency > 0);
    await queue.close();
  });

  it("should reject jobs after the queue has been closed", async () => {
    const queue = new InMemoryQueue();
    await queue.close();

    await assert.rejects(
      async () => {
        await queue.addSubmissionJob({
          submissionId: "test-sub-123",
          problemId: "test-prob-1",
          userId: "test-user-1",
          language: "PYTHON",
          code: "print('hello')",
        });
      },
      {
        message: "Job queue is closed",
      }
    );
  });

  it("should emit failure event and increment failed count when job handler throws", async () => {
    const queue = new InMemoryQueue();

    // Passing a non-existent submissionId will cause processSubmissionJob to fail/throw
    const fakeJobId = "non-existent-sub-" + Date.now();

    const failurePromise = new Promise<{ jobId: string; error: string }>((resolve) => {
      queue.once("failed", (event) => {
        resolve(event);
      });
    });

    await queue.addSubmissionJob({
      submissionId: fakeJobId,
      problemId: "non-existent-prob",
      userId: "non-existent-user",
      language: "PYTHON",
      code: "print(1)",
    });

    const failedEvent = await failurePromise;
    assert.equal(failedEvent.jobId, fakeJobId);

    const metrics = await queue.getMetrics();
    assert.equal(metrics.failed, 1);
    assert.equal(metrics.active, 0);

    await queue.close();
  });
});

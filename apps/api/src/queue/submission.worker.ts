import prisma from "../lib/prisma";
import { evaluateSuite } from "../judge";
import { SubmissionJobData, SubmissionJobResult } from "./types";

/**
 * Core submission processor executed by queue workers.
 */
export async function processSubmissionJob(
  jobData: SubmissionJobData
): Promise<SubmissionJobResult> {
  const { submissionId, problemId, userId, language, code } = jobData;

  console.log(`[Worker] Starting evaluation for submission: ${submissionId} (Problem: ${problemId})`);

  // 1. Mark submission as RUNNING in DB
  await prisma.submission.update({
    where: { id: submissionId },
    data: { verdict: "RUNNING" },
  });

  // 2. Fetch problem details and all test cases
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!problem) {
    throw new Error(`Problem ${problemId} not found`);
  }

  // 3. Evaluate solution across the complete test suite in isolated sandbox
  const evalResult = await evaluateSuite(
    language,
    code,
    problem.testCases,
    problem.timeLimit,
    problem.memoryLimit
  );

  // 4. Calculate rating bonus if first-time ACCEPTED
  let ratingBonus = 0;
  if (evalResult.verdict === "ACCEPTED") {
    const priorAccepted = await prisma.submission.findFirst({
      where: {
        userId,
        problemId,
        verdict: "ACCEPTED",
        id: { not: submissionId },
      },
    });

    if (!priorAccepted) {
      const bonusMap: Record<string, number> = { EASY: 10, MEDIUM: 20, HARD: 35 };
      ratingBonus = bonusMap[problem.difficulty] || 15;

      await prisma.user.update({
        where: { id: userId },
        data: { rating: { increment: ratingBonus } },
      });
      console.log(`[Worker] Awarded +${ratingBonus} rating bonus to user ${userId}`);
    }
  }

  // 5. Update submission record with final evaluation results
  const updatedSubmission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      verdict: evalResult.verdict,
      testCasesPassed: evalResult.testCasesPassed,
      totalTestCases: evalResult.totalTestCases,
      runtime: evalResult.maxRuntimeMs,
      memory: evalResult.peakMemoryKb,
      errorMessage:
        evalResult.compileOutput ||
        evalResult.testCaseResults.find((tc) => tc.error)?.error ||
        null,
    },
  });

  console.log(
    `[Worker] Finished evaluation for submission ${submissionId}: ${evalResult.verdict} (${evalResult.testCasesPassed}/${evalResult.totalTestCases} passed)`
  );

  return {
    submissionId,
    evaluation: evalResult,
    ratingBonus,
  };
}

import { ExecutionRequest, ExecutionResult, JudgeVerdict } from "./types";
import { getSandboxDriver } from "./drivers";
import { checkOutput } from "./checker";

export * from "./types";
export * from "./checker";
export * from "./compiler";
export * from "./runner";

/**
 * Executes user code in an isolated sandbox and returns the stdout, stderr,
 * execution time, and process verdict.
 */
export async function executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
  const driver = await getSandboxDriver();
  return driver.execute(request);
}

export interface TestCaseEvaluation {
  testCaseId: string;
  order: number;
  isSample: boolean;
  verdict: JudgeVerdict;
  executionTimeMs: number;
  memoryUsedKb: number;
  actualOutput?: string;
  expectedOutput?: string;
  error?: string;
}

export interface SubmissionEvaluationResult {
  verdict: JudgeVerdict;
  totalTestCases: number;
  testCasesPassed: number;
  maxRuntimeMs: number;
  peakMemoryKb: number;
  compileOutput?: string;
  testCaseResults: TestCaseEvaluation[];
}

/**
 * Runs user code against an entire suite of test cases (sample and hidden)
 * and calculates the final verdict, passing rate, and peak performance metrics.
 */
export async function evaluateSuite(
  language: "CPP" | "PYTHON" | "JAVA",
  code: string,
  testCases: Array<{ id: string; input: string; expectedOutput: string; isSample: boolean; order: number }>,
  timeLimitMs: number = 2000,
  memoryLimitMb: number = 256
): Promise<SubmissionEvaluationResult> {
  const testCaseResults: TestCaseEvaluation[] = [];
  let passedCount = 0;
  let maxRuntime = 0;
  let peakMemory = 0;
  let finalVerdict: JudgeVerdict = "ACCEPTED";

  // Sort test cases by order
  const sortedCases = [...testCases].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sortedCases.length; i++) {
    const tc = sortedCases[i];

    // Execute code with current testcase stdin
    const execResult = await executeCode({
      language,
      code,
      stdin: tc.input,
      timeLimitMs,
      memoryLimitMb,
    });

    maxRuntime = Math.max(maxRuntime, execResult.executionTimeMs);
    peakMemory = Math.max(peakMemory, execResult.memoryUsedKb);

    // 1. Compilation Error: Fail immediately across all test cases
    if (execResult.verdict === "COMPILATION_ERROR") {
      return {
        verdict: "COMPILATION_ERROR",
        totalTestCases: testCases.length,
        testCasesPassed: 0,
        maxRuntimeMs: execResult.executionTimeMs,
        peakMemoryKb: 0,
        compileOutput: execResult.compileOutput || execResult.stderr,
        testCaseResults: [
          {
            testCaseId: tc.id,
            order: tc.order,
            isSample: tc.isSample,
            verdict: "COMPILATION_ERROR",
            executionTimeMs: execResult.executionTimeMs,
            memoryUsedKb: 0,
            error: execResult.compileOutput || execResult.stderr,
          },
        ],
      };
    }

    // 2. Runtime Error
    if (execResult.verdict === "RUNTIME_ERROR") {
      finalVerdict = "RUNTIME_ERROR";
      testCaseResults.push({
        testCaseId: tc.id,
        order: tc.order,
        isSample: tc.isSample,
        verdict: "RUNTIME_ERROR",
        executionTimeMs: execResult.executionTimeMs,
        memoryUsedKb: execResult.memoryUsedKb,
        actualOutput: execResult.stdout,
        expectedOutput: tc.isSample ? tc.expectedOutput : undefined,
        error: execResult.stderr || execResult.error,
      });
      break; // Stop on first failing test case
    }

    // 3. Time Limit Exceeded
    if (execResult.verdict === "TIME_LIMIT_EXCEEDED") {
      finalVerdict = "TIME_LIMIT_EXCEEDED";
      testCaseResults.push({
        testCaseId: tc.id,
        order: tc.order,
        isSample: tc.isSample,
        verdict: "TIME_LIMIT_EXCEEDED",
        executionTimeMs: execResult.executionTimeMs,
        memoryUsedKb: execResult.memoryUsedKb,
        error: `Execution timed out (> ${timeLimitMs}ms)`,
      });
      break; // Stop on first failing test case
    }

    // 4. Output verification
    const comparison = checkOutput(execResult.stdout, tc.expectedOutput);
    if (comparison.isMatch) {
      passedCount++;
      testCaseResults.push({
        testCaseId: tc.id,
        order: tc.order,
        isSample: tc.isSample,
        verdict: "ACCEPTED",
        executionTimeMs: execResult.executionTimeMs,
        memoryUsedKb: execResult.memoryUsedKb,
        actualOutput: execResult.stdout,
        expectedOutput: tc.expectedOutput,
      });
    } else {
      finalVerdict = "WRONG_ANSWER";
      testCaseResults.push({
        testCaseId: tc.id,
        order: tc.order,
        isSample: tc.isSample,
        verdict: "WRONG_ANSWER",
        executionTimeMs: execResult.executionTimeMs,
        memoryUsedKb: execResult.memoryUsedKb,
        actualOutput: execResult.stdout,
        expectedOutput: tc.isSample ? tc.expectedOutput : undefined, // Hide expected output for hidden testcases
        error: comparison.diffSummary,
      });
      break; // Stop on first failing test case
    }
  }

  return {
    verdict: finalVerdict,
    totalTestCases: testCases.length,
    testCasesPassed: passedCount,
    maxRuntimeMs: maxRuntime,
    peakMemoryKb: peakMemory,
    testCaseResults,
  };
}

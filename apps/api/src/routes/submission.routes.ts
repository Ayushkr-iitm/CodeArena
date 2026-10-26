import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { authenticate, AuthRequest } from "../middleware/auth";
import { executeCode, evaluateSuite, checkOutput } from "../judge";

export const submissionRouter = Router();

// Validation Schemas
const runSchema = z.object({
  language: z.enum(["CPP", "PYTHON", "JAVA"]),
  code: z.string().min(1, "Code cannot be empty"),
  stdin: z.string().optional().default(""),
  problemId: z.string().optional(),
  expectedOutput: z.string().optional(),
});

const submitSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum(["CPP", "PYTHON", "JAVA"]),
  code: z.string().min(1, "Code cannot be empty"),
});

// ============================================
// POST /api/submissions/run - Interactive Testcase Run
// ============================================
submissionRouter.post("/run", async (req, res, next) => {
  try {
    const { language, code, stdin, problemId, expectedOutput } = runSchema.parse(req.body);

    let timeLimitMs = 2000;
    let memoryLimitMb = 256;

    if (problemId) {
      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        select: { timeLimit: true, memoryLimit: true },
      });
      if (problem) {
        timeLimitMs = problem.timeLimit;
        memoryLimitMb = problem.memoryLimit;
      }
    }

    // Execute in sandbox engine
    const execResult = await executeCode({
      language,
      code,
      stdin,
      timeLimitMs,
      memoryLimitMb,
    });

    let comparison = undefined;
    if (expectedOutput !== undefined && execResult.verdict === "ACCEPTED") {
      comparison = checkOutput(execResult.stdout, expectedOutput);
    }

    res.json({
      success: true,
      data: {
        verdict: comparison ? (comparison.isMatch ? "ACCEPTED" : "WRONG_ANSWER") : execResult.verdict,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        compileOutput: execResult.compileOutput,
        executionTimeMs: execResult.executionTimeMs,
        memoryUsedKb: execResult.memoryUsedKb,
        exitCode: execResult.exitCode,
        isMatch: comparison?.isMatch,
        diffSummary: comparison?.diffSummary,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/submissions - Submit code to Online Judge
// ============================================
submissionRouter.post("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { problemId, language, code } = submitSchema.parse(req.body);

    // Verify problem exists with test cases
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          orderBy: { order: "asc" },
        },
      },
    });
    if (!problem) throw new AppError("Problem not found", 404);

    if (problem.testCases.length === 0) {
      throw new AppError("This problem has no test cases configured in the judge.", 400);
    }

    // 1. Create submission with RUNNING status
    const submission = await prisma.submission.create({
      data: {
        userId: req.userId!,
        problemId,
        language,
        code,
        verdict: "RUNNING",
        totalTestCases: problem.testCases.length,
        testCasesPassed: 0,
      },
    });

    // 2. Evaluate solution against all test cases in the execution engine
    const evalResult = await evaluateSuite(
      language,
      code,
      problem.testCases,
      problem.timeLimit,
      problem.memoryLimit
    );

    // 3. Check if first time accepted to award rating bonus
    let ratingBonus = 0;
    if (evalResult.verdict === "ACCEPTED") {
      const priorAccepted = await prisma.submission.findFirst({
        where: {
          userId: req.userId!,
          problemId,
          verdict: "ACCEPTED",
          id: { not: submission.id },
        },
      });

      if (!priorAccepted) {
        const bonusMap: Record<string, number> = { EASY: 10, MEDIUM: 20, HARD: 35 };
        ratingBonus = bonusMap[problem.difficulty] || 15;
        await prisma.user.update({
          where: { id: req.userId },
          data: { rating: { increment: ratingBonus } },
        });
      }
    }

    // 4. Update submission record with final verdict and performance telemetry
    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        verdict: evalResult.verdict,
        testCasesPassed: evalResult.testCasesPassed,
        totalTestCases: evalResult.totalTestCases,
        runtime: evalResult.maxRuntimeMs,
        memory: evalResult.peakMemoryKb,
        errorMessage: evalResult.compileOutput || evalResult.testCaseResults.find((tc) => tc.error)?.error,
      },
      include: {
        problem: { select: { title: true, slug: true, difficulty: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        submission: updatedSubmission,
        evaluation: evalResult,
        ratingBonus,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/submissions - List user's submissions
// ============================================
submissionRouter.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));
    const problemId = req.query.problemId as string;
    const verdict = req.query.verdict as string;
    const language = req.query.language as string;

    const where: any = { userId: req.userId };
    if (problemId) where.problemId = problemId;
    if (verdict) where.verdict = verdict;
    if (language) where.language = language;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          language: true,
          verdict: true,
          runtime: true,
          memory: true,
          testCasesPassed: true,
          totalTestCases: true,
          createdAt: true,
          problem: { select: { title: true, slug: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: submissions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/submissions/problem/:slug - Get user submissions for a specific problem
// ============================================
submissionRouter.get("/problem/:slug", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { slug } = req.params;
    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!problem) throw new AppError("Problem not found", 404);

    const submissions = await prisma.submission.findMany({
      where: {
        userId: req.userId!,
        problemId: problem.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        language: true,
        verdict: true,
        runtime: true,
        memory: true,
        testCasesPassed: true,
        totalTestCases: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/submissions/:id - Get submission detail
// ============================================
submissionRouter.get("/:id", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { problem: { select: { title: true, slug: true } } },
    });

    if (!submission) throw new AppError("Submission not found", 404);

    // Only allow viewing own submissions (or admin)
    if (submission.userId !== req.userId && req.userRole !== "ADMIN") {
      throw new AppError("Forbidden", 403);
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
});

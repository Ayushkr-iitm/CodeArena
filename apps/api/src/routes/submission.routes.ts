import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { authenticate, AuthRequest } from "../middleware/auth";

export const submissionRouter = Router();

// Validation
const submitSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum(["CPP", "PYTHON", "JAVA"]),
  code: z.string().min(1, "Code cannot be empty"),
});

// ============================================
// POST /api/submissions - Submit code
// ============================================
submissionRouter.post("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { problemId, language, code } = submitSchema.parse(req.body);

    // Verify problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { _count: { select: { testCases: true } } },
    });
    if (!problem) throw new AppError("Problem not found", 404);

    // Create submission with PENDING verdict
    const submission = await prisma.submission.create({
      data: {
        userId: req.userId!,
        problemId,
        language,
        code,
        verdict: "PENDING",
        totalTestCases: problem._count.testCases,
        testCasesPassed: 0,
      },
    });

    // TODO: Push to job queue for judging (Step 7)

    res.status(201).json({ success: true, data: submission });
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

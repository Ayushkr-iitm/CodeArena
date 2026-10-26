import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { authenticate, AuthRequest, requireAdmin } from "../middleware/auth";
import { enqueueSubmission } from "../queue";

export const contestRouter = Router();

// Validation Schemas
const createContestSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(""),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  problems: z.array(
    z.object({
      problemId: z.string(),
      points: z.number().int().positive().default(100),
      order: z.number().int().nonnegative().default(0),
    })
  ).min(1, "Contest must contain at least one problem"),
});

const submitContestSchema = z.object({
  problemId: z.string(),
  language: z.enum(["CPP", "PYTHON", "JAVA"]),
  code: z.string().min(1, "Code cannot be empty"),
});

// Dynamic contest status helper
function computeContestStatus(startTime: Date, endTime: Date): "UPCOMING" | "RUNNING" | "ENDED" {
  const now = new Date();
  if (now < startTime) return "UPCOMING";
  if (now > endTime) return "ENDED";
  return "RUNNING";
}

// ============================================
// GET /api/contests - List all contests
// ============================================
contestRouter.get("/", async (req, res, next) => {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { startTime: "desc" },
      include: {
        _count: {
          select: {
            problems: true,
            participants: true,
          },
        },
      },
    });

    const enriched = contests.map((c) => ({
      ...c,
      status: computeContestStatus(c.startTime, c.endTime),
      problemCount: c._count.problems,
      participantCount: c._count.participants,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/contests/:slug - Contest details & problem list
// ============================================
contestRouter.get("/:slug", async (req: any, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.headers.authorization ? req.userId : undefined;

    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: {
        problems: {
          orderBy: { order: "asc" },
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                tags: { select: { tag: { select: { name: true } } } },
              },
            },
          },
        },
        participants: {
          select: {
            userId: true,
            score: true,
            penalty: true,
            rank: true,
          },
        },
        _count: {
          select: { participants: true, problems: true },
        },
      },
    });

    if (!contest) throw new AppError("Contest not found", 404);

    const status = computeContestStatus(contest.startTime, contest.endTime);
    const isRegistered = userId
      ? contest.participants.some((p) => p.userId === userId)
      : false;

    // Mask problems if contest is upcoming
    const visibleProblems =
      status === "UPCOMING"
        ? contest.problems.map((cp, idx) => ({
            id: cp.problemId,
            order: cp.order,
            points: cp.points,
            problem: {
              id: cp.problemId,
              title: `Problem ${String.fromCharCode(65 + idx)}`,
              slug: `problem-${String.fromCharCode(65 + idx).toLowerCase()}`,
              difficulty: "LOCKED",
              tags: [],
            },
          }))
        : contest.problems;

    res.json({
      success: true,
      data: {
        ...contest,
        status,
        isRegistered,
        problems: visibleProblems,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/contests/:id/register - Register user for contest
// ============================================
contestRouter.post("/:id/register", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const contestId = req.params.id;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });
    if (!contest) throw new AppError("Contest not found", 404);

    const status = computeContestStatus(contest.startTime, contest.endTime);
    if (status === "ENDED") {
      throw new AppError("Cannot register for an ended contest", 400);
    }

    const participant = await prisma.contestParticipant.upsert({
      where: {
        contestId_userId: {
          contestId,
          userId: req.userId!,
        },
      },
      update: {},
      create: {
        contestId,
        userId: req.userId!,
      },
    });

    res.status(201).json({
      success: true,
      message: "Successfully registered for contest",
      data: participant,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/contests/:id/submit - Submit solution for contest problem
// ============================================
contestRouter.post("/:id/submit", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const contestId = req.params.id;
    const { problemId, language, code } = submitContestSchema.parse(req.body);

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: { where: { problemId } },
      },
    });
    if (!contest) throw new AppError("Contest not found", 404);

    const status = computeContestStatus(contest.startTime, contest.endTime);
    if (status !== "RUNNING") {
      throw new AppError(`Cannot submit code: Contest is currently ${status.toLowerCase()}`, 400);
    }

    const contestProblem = contest.problems[0];
    if (!contestProblem) {
      throw new AppError("Problem does not belong to this contest", 400);
    }

    // Ensure user is registered as participant
    await prisma.contestParticipant.upsert({
      where: {
        contestId_userId: { contestId, userId: req.userId! },
      },
      update: {},
      create: { contestId, userId: req.userId! },
    });

    // 1. Create submission record in DB
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { _count: { select: { testCases: true } } },
    });

    const submission = await prisma.submission.create({
      data: {
        userId: req.userId!,
        problemId,
        language,
        code,
        verdict: "PENDING",
        totalTestCases: problem?._count.testCases || 0,
        testCasesPassed: 0,
      },
    });

    // 2. Link to contest submissions
    await prisma.contestSubmission.create({
      data: {
        contestId,
        submissionId: submission.id,
      },
    });

    // 3. Dispatch to worker queue
    const jobId = await enqueueSubmission({
      submissionId: submission.id,
      problemId,
      userId: req.userId!,
      language,
      code,
    });

    // 4. Update contest participant score & penalty in background upon completion
    // The worker handles grading, and recalculateContestScores updates participant standing
    res.status(202).json({
      success: true,
      data: {
        submissionId: submission.id,
        jobId,
        contestId,
        verdict: "PENDING",
        status: "QUEUED",
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/contests/:slug/leaderboard - Live Contest Standings
// ============================================
contestRouter.get("/:slug/leaderboard", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { slug },
      include: {
        problems: {
          orderBy: { order: "asc" },
          include: {
            problem: { select: { id: true, title: true, slug: true } },
          },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true, rating: true },
            },
          },
        },
        submissions: {
          include: {
            submission: {
              select: {
                id: true,
                userId: true,
                problemId: true,
                verdict: true,
                runtime: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!contest) throw new AppError("Contest not found", 404);

    // Compute ICPC standings
    const contestStartTime = contest.startTime.getTime();

    const standings = contest.participants.map((p) => {
      let totalScore = 0;
      let totalPenalty = 0;

      const problemMatrix: Record<string, { solved: boolean; points: number; attempts: number; timeMinutes?: number }> = {};

      contest.problems.forEach((cp) => {
        // Find all submissions by this user for this problem
        const userSubs = contest.submissions
          .filter((cs) => cs.submission.userId === p.userId && cs.submission.problemId === cp.problemId)
          .sort((a, b) => a.submission.createdAt.getTime() - b.submission.createdAt.getTime());

        let solved = false;
        let attempts = 0;
        let solvedMinutes = 0;

        for (const cs of userSubs) {
          attempts++;
          if (cs.submission.verdict === "ACCEPTED") {
            solved = true;
            solvedMinutes = Math.max(0, Math.floor((cs.submission.createdAt.getTime() - contestStartTime) / 60000));
            break;
          }
        }

        if (solved) {
          totalScore += cp.points;
          // ICPC Penalty formula: minutes to solve + 20 penalty minutes per rejected attempt before solve
          const penaltyForProblem = solvedMinutes + (attempts - 1) * 20;
          totalPenalty += penaltyForProblem;
          problemMatrix[cp.problemId] = {
            solved: true,
            points: cp.points,
            attempts,
            timeMinutes: solvedMinutes,
          };
        } else {
          problemMatrix[cp.problemId] = {
            solved: false,
            points: 0,
            attempts,
          };
        }
      });

      return {
        user: p.user,
        score: totalScore,
        penalty: totalPenalty,
        problems: problemMatrix,
      };
    });

    // Rank participants: higher score first, tie-break by lower penalty
    standings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.penalty - b.penalty;
    });

    const rankedStandings = standings.map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

    res.json({
      success: true,
      data: {
        contest: {
          id: contest.id,
          title: contest.title,
          slug: contest.slug,
          status: computeContestStatus(contest.startTime, contest.endTime),
          problems: contest.problems.map((cp) => ({
            id: cp.problemId,
            title: cp.problem.title,
            slug: cp.problem.slug,
            order: cp.order,
            points: cp.points,
          })),
        },
        standings: rankedStandings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN: POST /api/contests - Create Contest
// ============================================
contestRouter.post("/", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createContestSchema.parse(req.body);
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const contest = await prisma.contest.create({
      data: {
        title: data.title,
        slug,
        description: data.description || "",
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        problems: {
          create: data.problems.map((p, idx) => ({
            problemId: p.problemId,
            points: p.points,
            order: p.order ?? idx,
          })),
        },
      },
      include: {
        problems: { include: { problem: true } },
      },
    });

    res.status(201).json({ success: true, data: contest });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN: DELETE /api/contests/:id - Delete Contest
// ============================================
contestRouter.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.contest.delete({ where: { id } });
    res.json({ success: true, message: "Contest deleted successfully" });
  } catch (error) {
    next(error);
  }
});

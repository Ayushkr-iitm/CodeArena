import { Router } from "express";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export const userRouter = Router();

// ============================================
// GET /api/users/profile/:username - Public profile
// ============================================
userRouter.get("/profile/:username", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true,
        username: true,
        displayName: true,
        rating: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);

    // Get all accepted submissions to calculate unique problems solved
    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      select: {
        verdict: true,
        problemId: true,
        problem: { select: { difficulty: true } },
      },
    });

    const totalSubmissions = submissions.length;
    const accepted = submissions.filter((s) => s.verdict === "ACCEPTED");

    // Count UNIQUE problems solved (not duplicate AC submissions)
    const solvedProblems = new Map<string, string>(); // problemId -> difficulty
    for (const s of accepted) {
      if (!solvedProblems.has(s.problemId)) {
        solvedProblems.set(s.problemId, s.problem.difficulty);
      }
    }

    const difficulties = Array.from(solvedProblems.values());

    const stats = {
      totalSolved: solvedProblems.size,
      easySolved: difficulties.filter((d) => d === "EASY").length,
      mediumSolved: difficulties.filter((d) => d === "MEDIUM").length,
      hardSolved: difficulties.filter((d) => d === "HARD").length,
      totalSubmissions,
      acceptanceRate:
        totalSubmissions > 0
          ? Math.round((accepted.length / totalSubmissions) * 100)
          : 0,
    };

    res.json({ success: true, data: { user, stats } });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/users/leaderboard - Top users by rating
// ============================================
userRouter.get("/leaderboard", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 50));

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          rating: true,
          avatarUrl: true,
        },
        orderBy: { rating: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count(),
    ]);

    // Add rank based on position
    const rankedUsers = users.map((u, i) => ({
      ...u,
      rank: (page - 1) * pageSize + i + 1,
    }));

    res.json({
      success: true,
      data: {
        items: rankedUsers,
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

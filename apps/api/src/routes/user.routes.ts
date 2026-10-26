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

    // Get all submissions to calculate stats
    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      select: {
        verdict: true,
        problemId: true,
        language: true,
        problem: { select: { difficulty: true } },
      },
    });

    const totalSubmissions = submissions.length;
    const accepted = submissions.filter((s) => s.verdict === "ACCEPTED");

    // Count UNIQUE problems solved
    const solvedProblems = new Map<string, string>();
    for (const s of accepted) {
      if (!solvedProblems.has(s.problemId)) {
        solvedProblems.set(s.problemId, s.problem.difficulty);
      }
    }

    const difficulties = Array.from(solvedProblems.values());

    // Language usage breakdown
    const languageStats: Record<string, number> = { CPP: 0, PYTHON: 0, JAVA: 0 };
    for (const s of submissions) {
      if (s.language && languageStats[s.language] !== undefined) {
        languageStats[s.language]++;
      }
    }

    // 10 most recent submissions
    const recentSubmissions = await prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        language: true,
        verdict: true,
        runtime: true,
        memory: true,
        createdAt: true,
        problem: {
          select: {
            title: true,
            slug: true,
            difficulty: true,
          },
        },
      },
    });

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
      languageStats,
      recentSubmissions,
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

    const userIds = users.map((u) => u.id);
    const acceptedSubs = await prisma.submission.findMany({
      where: {
        userId: { in: userIds },
        verdict: "ACCEPTED",
      },
      select: {
        userId: true,
        problemId: true,
      },
    });

    // Map distinct solved problems per user
    const solvedMap: Record<string, Set<string>> = {};
    for (const sub of acceptedSubs) {
      if (!solvedMap[sub.userId]) {
        solvedMap[sub.userId] = new Set();
      }
      solvedMap[sub.userId].add(sub.problemId);
    }

    // Add rank and totalSolved based on position
    const rankedUsers = users.map((u, i) => ({
      ...u,
      rank: (page - 1) * pageSize + i + 1,
      totalSolved: solvedMap[u.id]?.size || 0,
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

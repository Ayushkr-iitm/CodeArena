import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { authenticate, AuthRequest } from "../middleware/auth";

export const communityRouter = Router();

// Validation Schemas
const createCommentSchema = z.object({
  problemId: z.string(),
  content: z.string().min(2, "Comment must be at least 2 characters").max(2000),
  parentId: z.string().optional(),
});

const voteSchema = z.object({
  type: z.enum(["UPVOTE", "DOWNVOTE"]),
});

const createSolutionSchema = z.object({
  problemId: z.string(),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  code: z.string().min(5, "Code cannot be empty"),
  language: z.enum(["CPP", "PYTHON", "JAVA"]),
  timeComplexity: z.string().default("O(N)"),
  spaceComplexity: z.string().default("O(1)"),
});

// ============================================
// 1. COMMENTS & DISCUSSIONS
// ============================================

/**
 * GET /api/community/comments/:problemId
 * Fetch all top-level comments and their nested replies
 */
communityRouter.get("/comments/:problemId", async (req, res, next) => {
  try {
    const { problemId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        problemId,
        parentId: null, // Top-level comments
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            rating: true,
            avatarUrl: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                rating: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/community/comments
 * Post a new comment or reply
 */
communityRouter.post("/comments", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { problemId, content, parentId } = createCommentSchema.parse(req.body);
    const userId = req.userId!;

    const comment = await prisma.comment.create({
      data: {
        problemId,
        content,
        parentId: parentId || null,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            rating: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/community/comments/:id/vote
 * Vote (Upvote/Downvote) on a comment
 */
communityRouter.post("/comments/:id/vote", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id: commentId } = req.params;
    const { type } = voteSchema.parse(req.body);
    const userId = req.userId!;

    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === type) {
        // Toggle vote off
        await prisma.commentVote.delete({
          where: { id: existingVote.id },
        });
        const delta = type === "UPVOTE" ? -1 : 1;
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            [type === "UPVOTE" ? "upvotes" : "downvotes"]: { decrement: 1 },
          },
        });
        return res.json({ success: true, message: "Vote removed", voted: null });
      } else {
        // Switch vote type
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { type },
        });
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            upvotes: { [type === "UPVOTE" ? "increment" : "decrement"]: 1 },
            downvotes: { [type === "DOWNVOTE" ? "increment" : "decrement"]: 1 },
          },
        });
        return res.json({ success: true, message: "Vote switched", voted: type });
      }
    }

    // New vote
    await prisma.commentVote.create({
      data: {
        userId,
        commentId,
        type,
      },
    });

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        [type === "UPVOTE" ? "upvotes" : "downvotes"]: { increment: 1 },
      },
    });

    res.json({ success: true, message: "Vote registered", voted: type });
  } catch (error) {
    next(error);
  }
});

// ============================================
// 2. SOLUTIONS & APPROACHES
// ============================================

/**
 * GET /api/community/solutions/:problemId
 * Fetch all community-shared solutions for a problem
 */
communityRouter.get("/solutions/:problemId", async (req, res, next) => {
  try {
    const { problemId } = req.params;

    const solutions = await prisma.solution.findMany({
      where: { problemId },
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            rating: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({ success: true, data: solutions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/community/solutions
 * Publish a new solution & explanation
 */
communityRouter.post("/solutions", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const payload = createSolutionSchema.parse(req.body);
    const userId = req.userId!;

    const solution = await prisma.solution.create({
      data: {
        ...payload,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            rating: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: solution });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/community/solutions/:id/vote
 * Toggle upvote on a community solution
 */
communityRouter.post("/solutions/:id/vote", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id: solutionId } = req.params;
    const userId = req.userId!;

    const existingVote = await prisma.solutionVote.findUnique({
      where: {
        userId_solutionId: {
          userId,
          solutionId,
        },
      },
    });

    if (existingVote) {
      await prisma.solutionVote.delete({
        where: { id: existingVote.id },
      });
      await prisma.solution.update({
        where: { id: solutionId },
        data: { upvotes: { decrement: 1 } },
      });
      return res.json({ success: true, message: "Upvote removed", upvoted: false });
    }

    await prisma.solutionVote.create({
      data: {
        userId,
        solutionId,
      },
    });
    await prisma.solution.update({
      where: { id: solutionId },
      data: { upvotes: { increment: 1 } },
    });

    res.json({ success: true, message: "Upvote registered", upvoted: true });
  } catch (error) {
    next(error);
  }
});

// ============================================
// 3. EDITORIAL & HINTS
// ============================================

/**
 * GET /api/community/editorial/:problemId
 * Fetch editorial explanation and progressive hints
 */
communityRouter.get("/editorial/:problemId", async (req, res, next) => {
  try {
    const { problemId } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        slug: true,
        editorial: true,
        hints: true,
      },
    });

    if (!problem) throw new AppError("Problem not found", 404);

    let parsedHints: string[] = [];
    try {
      parsedHints = JSON.parse(problem.hints || "[]");
    } catch {
      parsedHints = [];
    }

    res.json({
      success: true,
      data: {
        editorial: problem.editorial,
        hints: parsedHints,
      },
    });
  } catch (error) {
    next(error);
  }
});

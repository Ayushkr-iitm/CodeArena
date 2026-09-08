import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

export const problemRouter = Router();

// Helper: generate URL slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// ============================================
// GET /api/problems - List problems with filters
// ============================================
problemRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));
    const difficulty = req.query.difficulty as string;
    const tag = req.query.tag as string;
    const search = req.query.search as string;

    const where: any = { isPublished: true };

    if (difficulty) where.difficulty = difficulty;
    if (tag) where.tags = { some: { tag: { slug: tag } } };
    if (search) {
      where.title = { contains: search };
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: { include: { tag: { select: { name: true, slug: true } } } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.problem.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: problems.map((p) => ({
          ...p,
          tags: p.tags.map((t) => t.tag),
          submissionCount: p._count.submissions,
        })),
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
// GET /api/problems/:slug - Get problem detail
// ============================================
problemRouter.get("/:slug", async (req, res, next) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      include: {
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        testCases: {
          where: { isSample: true },
          orderBy: { order: "asc" },
          select: { id: true, input: true, expectedOutput: true, order: true },
        },
        _count: { select: { submissions: true, testCases: true } },
      },
    });

    if (!problem || !problem.isPublished) {
      throw new AppError("Problem not found", 404);
    }

    res.json({
      success: true,
      data: {
        ...problem,
        tags: problem.tags.map((t) => t.tag),
        totalTestCases: problem._count.testCases,
        submissionCount: problem._count.submissions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/problems - Create problem (Admin)
// ============================================
const createProblemSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  timeLimit: z.number().min(100).default(2000),
  memoryLimit: z.number().min(16).default(256),
  inputFormat: z.string().optional().default(""),
  outputFormat: z.string().optional().default(""),
  constraints: z.string().optional().default(""),
  sampleInput: z.string().optional().default(""),
  sampleOutput: z.string().optional().default(""),
  isPublished: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isSample: z.boolean().default(false),
        order: z.number().default(0),
      })
    )
    .optional(),
});

problemRouter.post("/", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createProblemSchema.parse(req.body);
    const slug = generateSlug(data.title);

    // Check slug uniqueness
    const existing = await prisma.problem.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError("A problem with a similar title already exists", 409);
    }

    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        difficulty: data.difficulty,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        inputFormat: data.inputFormat,
        outputFormat: data.outputFormat,
        constraints: data.constraints,
        sampleInput: data.sampleInput,
        sampleOutput: data.sampleOutput,
        isPublished: data.isPublished,
        tags: data.tags
          ? {
              create: data.tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: {
                      name: tagName,
                      slug: generateSlug(tagName),
                    },
                  },
                },
              })),
            }
          : undefined,
        testCases: data.testCases
          ? { create: data.testCases }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        testCases: true,
      },
    });

    res.status(201).json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PUT /api/problems/:id - Update problem (Admin)
// ============================================
problemRouter.put("/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { tags, testCases, ...data } = req.body;

    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data,
      include: {
        tags: { include: { tag: true } },
      },
    });

    res.json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE /api/problems/:id - Delete problem (Admin)
// ============================================
problemRouter.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    await prisma.problem.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Problem deleted" });
  } catch (error) {
    next(error);
  }
});

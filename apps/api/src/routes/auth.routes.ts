import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { authenticate, AuthRequest } from "../middleware/auth";

export const authRouter = Router();

// Helper: generate JWT access + refresh tokens
function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || "fallback-secret",
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
  return { accessToken, refreshToken };
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  displayName: z.string().min(1).optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ============================================
// POST /api/auth/register
// ============================================
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, username, displayName, password } = registerSchema.parse(req.body);

    // Check if email or username already taken
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      throw new AppError("Email or username already in use", 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
        passwordHash,
      },
    });

    // Generate tokens
    const tokens = generateTokens(user.id, user.role);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          rating: user.rating,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/auth/login
// ============================================
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          rating: user.rating,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/auth/refresh
// ============================================
authRouter.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret"
    ) as { userId: string; role: string };

    // Issue new access token
    const accessToken = jwt.sign(
      { userId: payload.userId, role: payload.role },
      process.env.JWT_ACCESS_SECRET || "fallback-secret",
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
    );

    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(new AppError("Invalid or expired refresh token", 401));
  }
});

// ============================================
// GET /api/auth/me (protected)
// ============================================
authRouter.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        rating: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

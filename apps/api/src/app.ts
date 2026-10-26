import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { errorHandler } from "./middleware/errorHandler";
import {
  generalLimiter,
  authLimiter,
  submissionLimiter,
  communityLimiter,
} from "./middleware/rate-limiter";

import { authRouter } from "./routes/auth.routes";
import { problemRouter } from "./routes/problem.routes";
import { submissionRouter } from "./routes/submission.routes";
import { userRouter } from "./routes/user.routes";
import { contestRouter } from "./routes/contest.routes";
import { communityRouter } from "./routes/community.routes";

export const app = express();

// ============================================
// MIDDLEWARE & SECURITY HEADERS
// ============================================

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Handled per-view or on Next.js frontend
  })
);

// CORS — allow frontend to make requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // allow cookies
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "10mb" })); // 10mb for code submissions

// Parse cookies
app.use(cookieParser());

// Request logging (skip during testing to keep test output clean)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Global API rate limiting
app.use("/api", generalLimiter);

// Specific rate limiting for sensitive endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/submissions", submissionLimiter);
app.use("/api/community/comments", communityLimiter);
app.use("/api/community/solutions", communityLimiter);

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/problems", problemRouter);
app.use("/api/submissions", submissionRouter);
app.use("/api/users", userRouter);
app.use("/api/contests", contestRouter);
app.use("/api/community", communityRouter);

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

export default app;

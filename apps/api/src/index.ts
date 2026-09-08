import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { problemRouter } from "./routes/problem.routes";
import { submissionRouter } from "./routes/submission.routes";
import { userRouter } from "./routes/user.routes";

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

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

// Request logging
app.use(morgan("dev"));

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

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n🚀 API server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;

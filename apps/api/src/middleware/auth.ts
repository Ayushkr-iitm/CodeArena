import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Middleware: Requires a valid JWT token
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    // Verify the token
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || "fallback-secret"
    ) as { userId: string; role: string };

    // Attach user info to request
    req.userId = payload.userId;
    req.userRole = payload.role;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Invalid or expired token", 401));
    }
  }
}

// Middleware: Requires admin role
export function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (req.userRole !== "ADMIN") {
    next(new AppError("Admin access required", 403));
    return;
  }
  next();
}

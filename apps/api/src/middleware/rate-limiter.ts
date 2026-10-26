import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

/**
 * Global API rate limiter:
 * 150 requests per minute per IP to prevent DoS scraping.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: "Too many requests from this IP. Please slow down and try again in a minute.",
  },
  skip: () => isTest,
});

/**
 * Authentication rate limiter:
 * 10 attempts per 15 minutes per IP to block brute-force credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  skip: () => isTest,
});

/**
 * Code submission rate limiter:
 * 5 submissions per 30 seconds per IP to protect the sandbox judge queue.
 */
export const submissionLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Submission cooldown in effect. Please wait 30 seconds between submissions.",
  },
  skip: () => isTest,
});

/**
 * Community rate limiter (comments & solutions):
 * 20 interactions per 5 minutes per IP to prevent forum spamming.
 */
export const communityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Community posting rate limit reached. Please wait a few minutes before posting again.",
  },
  skip: () => isTest,
});
